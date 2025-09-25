// e.g. inside Home page component
import { Profile } from '../components/Profile'

export default function HomePage() {
  return (
    <section>
      <h2 className="text-xl font-semibold">Home</h2>
      <Profile />
    </section>
  )
}
