export async function fetchGreet() {
  const res = await fetch('/greet');
  if (!res.ok) throw new Error('Failed to fetch greet message');
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch('/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
} 