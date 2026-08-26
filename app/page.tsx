import { redirect } from 'next/navigation'

/**
 * The root route previously carried a second, older copy of the dashboard.
 * The two had drifted apart: the copy here was missing the map, the zoonotic
 * sector filter and the SORMAS panel, and it was the version left showing a
 * stuck "Loading chart..." state.
 *
 * There is now one dashboard, at /dashboard, and one entry point to it.
 */
export default function Home() {
  redirect('/dashboard')
}
