// /server/auth/jwt.ts
import type { Context } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const ISSUER = process.env.KINDE_DOMAIN!
const AUDIENCE = process.env.KINDE_AUDIENCE!

const jwks = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`))

export async function requireAuth(c: Context) {
  try {
    const auth = c.req.header('authorization') || ''
    const [, token] = auth.split(' ')
    if (!token) return c.json({ error: 'Missing Bearer token' }, 401)

    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    // attach user to context (sub, email, etc.)
    // @ts-ignore - add a type if you like
    c.set('user', payload)
    return null // means OK, continue
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
