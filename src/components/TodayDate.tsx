'use client'

import { format } from 'date-fns'

export default function TodayDate() {
  return <>{format(new Date(), 'EEEE, MMMM d, yyyy')}</>
}
