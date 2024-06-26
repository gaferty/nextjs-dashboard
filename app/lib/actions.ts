'use server'
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import z from 'zod';

const FormSchema = z.object({
 id: z.string(),
 customerId: z.string(),
 amount: z.coerce.number(),
 status: z.enum(['pending', 'paid']),
 date: z.string(),
})
 // Test it out:
const CreateInvoice = FormSchema.omit({id: true, date: true})

export async function createInvoice(formData:FormData) {
  const {customerId, amount, status} =CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;
  } catch {
    return {message: 'Unable to insert into database'}
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}


// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;} catch {
    return {message: 'Database error could not find user'}
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
} catch {
  return {message: 'Unable to delete user'}
}
}
