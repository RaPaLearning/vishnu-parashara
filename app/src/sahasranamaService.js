// Utility to fetch sahasranama.json from the public folder
export async function fetchSahasranama() {
  const response = await fetch('/sahasranama.json');
  if (!response.ok) throw new Error('Failed to fetch sahasranama.json');
  return response.json();
}
