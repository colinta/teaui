import type {SystemEvent} from '@teaui/core'
import type {RequestError} from './errors.js'

export interface RemoteControlOptions {
  /** Loopback port. Defaults to 0 (let the OS choose an unused port). */
  port?: number
}

export interface RemoteControlAddress {
  readonly url: string
  readonly port: number
}

export type SnapshotFormat = 'plain' | 'ansi'

export interface SnapshotRequest {
  type: 'snapshot'
  format: SnapshotFormat
}

export type RemoteControlRequest = SystemEvent | SnapshotRequest

export interface SnapshotMessage {
  type: 'snapshot'
  /** Request sequence, or absent for an application-initiated broadcast. */
  sequence?: number
  format: SnapshotFormat
  snapshot: string
}

export type RemoteControlReply =
  | {type: 'ack'; sequence: number}
  | {
      type: 'error'
      sequence: number
      code: RequestError['type']
      message: string
    }
  | SnapshotMessage
