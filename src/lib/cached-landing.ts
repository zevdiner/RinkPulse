import { cache } from 'react'
import { getPlayerLanding } from './nhl-api'

/**
 * React cache()-wrapped getPlayerLanding.
 * Deduplicates calls within a single render tree — generateMetadata and the
 * page body can both call this without triggering two network requests.
 */
export const getCachedLanding = cache(getPlayerLanding)
