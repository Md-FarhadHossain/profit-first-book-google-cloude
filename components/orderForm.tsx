import gettAllPost from '@/lib/getAllorders'
import React from 'react'

const OrderForm = async () => {
  const posts = await gettAllPost()
  console.log(posts)
  return (
    <div>OrderForm</div>
  )
}

export default OrderForm