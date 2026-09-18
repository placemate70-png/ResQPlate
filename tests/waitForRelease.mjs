import assert from 'node:assert/strict'
export async function waitForRelease(client, id) {
  const deadline = Date.now() + 190000
  while (Date.now() < deadline) {
    const { data, error } = await client.from('donations').select('route_state').eq('id', id).single()
    assert.equal(error, null)
    if (data.route_state === 'released') return
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  assert.fail('RouteBuddy did not release after 180 seconds')
}
