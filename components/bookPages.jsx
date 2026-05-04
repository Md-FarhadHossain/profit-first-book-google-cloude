// app/book/page.tsx
import PageSwiper from '@/components/PageSwiper'

import page1 from "@/public/bookCover.png"

const pages = [
  { id: 0, type: 'image', src: {page1}, alt: 'Page 1' },
  { id: 1, type: 'image', src: {page1}, alt: 'Page 2' },
  // ... add 10-15 pages
]

export default function BookPage() {
  return <PageSwiper pages={pages} />
}