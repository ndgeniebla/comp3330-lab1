import { useKindeAuth } from '@kinde-oss/kinde-auth-react'

export function AuthBar() {
  const { isAuthenticated, login, logout, user, getToken } = useKindeAuth()

  return (
    <div className="flex items-center gap-3 text-sm">
      {isAuthenticated ? (
        <>
          <span className="text-gray-600">{user?.givenName ?? user?.email}</span>
          <button className="rounded bg-black px-3 py-1 text-white" onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <button className="rounded bg-black px-3 py-1 text-white" onClick={() => login()}>Login</button>
      )}
    </div>
  )
}
