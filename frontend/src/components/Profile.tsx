import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { useState } from 'react'

export function Profile() {
  const { isAuthenticated, getToken, user } = useKindeAuth()
  const [resp, setResp] = useState<string>('')

  async function loadProfile() {
    const token = await getToken()
    const res = await fetch('http://localhost:3000/api/secure/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    setResp(await res.text())
  }

  if (!isAuthenticated) return <p className="text-sm text-gray-600">Login to view profile.</p>

  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-gray-700">Signed in as: {user?.email}</p>
      <button className="rounded bg-black px-3 py-1 text-white" onClick={loadProfile}>Load Protected Profile</button>
      <pre className="rounded bg-gray-100 p-3 text-xs overflow-x-scroll">{resp}</pre>
    </div>
  )
}
