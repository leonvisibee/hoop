#!/usr/bin/env node
// Minimal JS implementation of Hoop local login using env vars
// Reads EMAIL, PASSWORD, API_URL (optional) and TLS_CA (optional base64 CA) from env
// Writes token into ~/.hoop/config.toml (creates dir/file if missing)

import fs from 'fs'
import os from 'os'
import path from 'path'
import https from 'https'
import http from 'http'
import { URL } from 'url'
import { parseTOML, stringifyTOML } from 'confbox'

const EMAIL = process.env.EMAIL
const PASSWORD = process.env.PASSWORD
const API_URL = process.env.API_URL || 'https://app.hoophq.com'
const TLS_CA_B64 = process.env.TLS_CA // optional base64 encoded CA

function loadCA() {
  if (!TLS_CA_B64) return null
  try {
    return Buffer.from(TLS_CA_B64, 'base64')
  } catch (e) {
    console.error('Failed to decode TLS_CA, ignoring')
    return null
  }
}

function httpRequest(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isHttps = u.protocol === 'https:'
    const lib = isHttps ? https : http
    const reqOpts = {
      method: opts.method || 'GET',
      headers: opts.headers || {},
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      rejectUnauthorized: opts.rejectUnauthorized !== undefined ? opts.rejectUnauthorized : true,
    }
    if (opts.ca) reqOpts.ca = opts.ca
    const req = lib.request(reqOpts, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        resolve({ res, body })
      })
    })
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

async function fetchAuthMethod(apiUrl, ca) {
  const url = new URL('/api/publicserverinfo', apiUrl).toString()
  const { res, body } = await httpRequest(url, { method: 'GET', ca })
  if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
    try {
      const json = JSON.parse(body)
      return String(json.auth_method || '')
    } catch (e) {
      throw new Error('failed decoding publicserverinfo response: ' + e.message)
    }
  }
  throw new Error(`failed fetching publicserverinfo, status=${res.statusCode}, body=${body}`)
}

async function authenticateLocally(apiUrl, email, password, ca) {
  const url = new URL('/api/localauth/login', apiUrl).toString()
  const payload = JSON.stringify({ email, password })
  const { res, body } = await httpRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload).toString(),
    },
    body: payload,
    ca,
  })
  if (res.statusCode && res.statusCode > 299) {
    throw new Error(`authentication failed, status=${res.statusCode}, body=${body}`)
  }
  const token = res.headers['token'] || res.headers['Token'] || res.headers['Authorization']
  if (!token) {
    throw new Error('token header not found in response')
  }
  return token
}

function readHoopConfig() {
  const dir = path.join(os.homedir(), '.hoop')
  const file = path.join(dir, 'config.toml')
  if (!fs.existsSync(file)) return {}
  try {
    const content = fs.readFileSync(file, 'utf8')
    return parseTOML(content)
  } catch (e) {
    // surface parse errors to the caller
    throw new Error(`failed parsing ${file}: ${e.message}`)
  }
}

function writeTokenToConfig(token, apiUrl) {
  const dir = path.join(os.homedir(), '.hoop')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'config.toml')
  const cfg = readHoopConfig()
  // set/override values
  if (apiUrl) cfg.api_url = apiUrl
  cfg.token = token
  const out = stringifyTOML(cfg)
  fs.writeFileSync(file, out, { mode: 0o600 })
}

function readCredentialsFromConfig() {
  try {
    const cfg = readHoopConfig()
    const email = cfg.email || cfg.username || cfg.user || ''
    const password = cfg.password || ''
    const apiUrl = cfg.api_url || cfg.apiURL || cfg.api || ''
    return { email, password, apiUrl }
  } catch (e) {
    // Config is invalid TOML; inform the user and return empty creds
    console.error(`Warning: could not parse ~/.hoop/config.toml: ${e.message}`)
    return { email: '', password: '', apiUrl: '' }
  }
}

async function loginAndSave({ email, password, apiUrl, tlsCa } = {}) {
  const ca = tlsCa || loadCA()
  // determine apiUrl
  // Read config safely: if config TOML is invalid, back it up and continue with an empty config.
  const dir = path.join(os.homedir(), '.hoop')
  const cfgFile = path.join(dir, 'config.toml')
  let cfg = {}
  if (fs.existsSync(cfgFile)) {
    try {
      const content = fs.readFileSync(cfgFile, 'utf8')
      cfg = parseTOML(content)
    } catch (e) {
      // Backup the invalid file so we don't lose data, then continue with empty cfg
      try {
        const bak = `${cfgFile}.invalid.${Date.now()}`
        fs.copyFileSync(cfgFile, bak)
        console.error(`Invalid TOML in ${cfgFile}: ${e.message}. Backed up original to ${bak} and continuing.`)
        cfg = {}
      } catch (copyErr) {
        // If backup fails, surface the error
        throw new Error(`failed to backup invalid config file ${cfgFile}: ${copyErr.message}`)
      }
    }
  }
  const finalApiUrl = apiUrl || cfg.api_url || API_URL

  if (!email || !password) {
    // try config
    const cred = readCredentialsFromConfig()
    email = email || cred.email
    password = password || cred.password
  }

  // fallback to environment variables if still missing
  email = email || EMAIL
  password = password || PASSWORD

  if (!email || !password) {
    throw new Error('no credentials provided (EMAIL/PASSWORD env or config file)')
  }

  const authMethod = await fetchAuthMethod(finalApiUrl, ca)
  if (!(authMethod && String(authMethod).toLowerCase() === 'local')) {
    throw new Error('remote auth method detected (not local); this helper only supports local email/password auth')
  }

  const token = await authenticateLocally(finalApiUrl, email, password, ca)
  writeTokenToConfig(token, finalApiUrl)
  return { token, apiUrl: finalApiUrl }
}

async function main() {
  try {
    await loginAndSave()
    console.log('Login succeeded, token saved to ~/.hoop/config.toml')
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  }
}

if (import.meta.main) await main()