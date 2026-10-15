import { useState } from 'react'
import { Plus, Xmark, Compass, NavArrowDown, NavArrowRight } from 'iconoir-react'
import { useRoomStore } from '@/store/room.store'
import { RoomItem } from './room-item'
import { UserSearch } from './user-search'
import { ExploreModal } from './explore-modal'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import styles from './room-list.module.css'

interface Props {
  activeId?: string
  onSelect(id: string): void
}

export function RoomList({ activeId, onSelect }: Props) {
  const { rooms, loading, createRoom } = useRoomStore()
  const [channelsOpen, setChannelsOpen] = useState(true)
  const [dmsOpen, setDmsOpen] = useState(true)
  const [creatingChannel, setCreatingChannel] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [searchingDM, setSearchingDM] = useState(false)
  const [channelName, setChannelName] = useState('')
  const [busy, setBusy] = useState(false)

  const channels = rooms.filter((r) => !r.is_dm)
  const directMessages = rooms.filter((r) => r.is_dm)

  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!channelName.trim()) return
    setBusy(true)
    try {
      const room = await createRoom(channelName.trim())
      setChannelName('')
      setCreatingChannel(false)
      onSelect(room.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* ── Public Channels Section ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <button
            className={styles.collapseToggle}
            onClick={() => setChannelsOpen((v) => !v)}
            aria-expanded={channelsOpen}
          >
            <span className={styles.arrowIcon}>
              {channelsOpen ? (
                <NavArrowDown width={14} height={14} strokeWidth={2.5} />
              ) : (
                <NavArrowRight width={14} height={14} strokeWidth={2.5} />
              )}
            </span>
            <span className={styles.sectionTitle}>Channels</span>
            <span className={styles.counter}>{channels.length}</span>
          </button>

          <div className={styles.headerActions}>
            <button
              className={styles.actionBtn}
              onClick={() => setExploreOpen(true)}
              title="Jelajahi Public Channels"
              aria-label="Jelajahi Public Channels"
            >
              <Compass width={14} height={14} strokeWidth={2.2} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => {
                setCreatingChannel((v) => !v)
                if (!channelsOpen) setChannelsOpen(true)
              }}
              title={creatingChannel ? 'Batal' : 'Buat Channel Baru'}
              aria-label={creatingChannel ? 'Batal' : 'Buat Channel Baru'}
            >
              {creatingChannel ? (
                <Xmark width={14} height={14} strokeWidth={2.5} />
              ) : (
                <Plus width={14} height={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {creatingChannel && (
          <form onSubmit={handleCreateChannel} className={styles.createForm}>
            <Input
              placeholder="Nama channel (cth: golang)..."
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              autoFocus
            />
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setCreatingChannel(false)}>
                Batal
              </Button>
              <Button type="submit" loading={busy}>
                Buat
              </Button>
            </div>
          </form>
        )}

        {channelsOpen && (
          <>
            {loading && !channels.length && (
              <div className={styles.hint}>
                <span className={styles.loaderDot} />
                <span>Memuat channels...</span>
              </div>
            )}

            {!loading && !channels.length && !creatingChannel && (
              <div className={styles.emptyHint}>
                <span>Belum ada channel.</span>
                <button
                  className={styles.inlineExploreLink}
                  onClick={() => setExploreOpen(true)}
                >
                  Jelajahi Public Rooms →
                </button>
              </div>
            )}

            <ul className={styles.list}>
              {channels.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  active={room.id === activeId}
                  onClick={() => onSelect(room.id)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* ── Direct Messages Section ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <button
            className={styles.collapseToggle}
            onClick={() => setDmsOpen((v) => !v)}
            aria-expanded={dmsOpen}
          >
            <span className={styles.arrowIcon}>
              {dmsOpen ? (
                <NavArrowDown width={14} height={14} strokeWidth={2.5} />
              ) : (
                <NavArrowRight width={14} height={14} strokeWidth={2.5} />
              )}
            </span>
            <span className={styles.sectionTitle}>Direct Messages</span>
            <span className={styles.counter}>{directMessages.length}</span>
          </button>

          <div className={styles.headerActions}>
            <button
              className={styles.actionBtn}
              onClick={() => {
                setSearchingDM((v) => !v)
                if (!dmsOpen) setDmsOpen(true)
              }}
              title={searchingDM ? 'Tutup Cari User' : 'Mulai Direct Message'}
              aria-label={searchingDM ? 'Tutup Cari User' : 'Mulai Direct Message'}
            >
              {searchingDM ? (
                <Xmark width={14} height={14} strokeWidth={2.5} />
              ) : (
                <Plus width={14} height={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {dmsOpen && (
          <>
            <UserSearch
              isOpen={searchingDM}
              onClose={() => setSearchingDM(false)}
              onSelect={onSelect}
            />

            {!loading && !directMessages.length && !searchingDM && (
              <div className={styles.emptyHint}>
                <span>Belum ada DM. Klik (+) untuk cari teman.</span>
              </div>
            )}

            <ul className={styles.list}>
              {directMessages.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  active={room.id === activeId}
                  onClick={() => onSelect(room.id)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {/* ── Explore Rooms Modal ── */}
      <ExploreModal
        isOpen={exploreOpen}
        onClose={() => setExploreOpen(false)}
        onSelect={onSelect}
      />
    </div>
  )
}
