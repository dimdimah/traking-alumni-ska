import { redirect } from 'next/navigation'

export default function SuperUserAddUserPage() {
  redirect('/admin/add-user')
}
