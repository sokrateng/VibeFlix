'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/lib/types'

interface CategoryManagerProps {
  token: string
}

export function CategoryManager({ token }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ display_name: '', icon: '' })
  const [loaded, setLoaded] = useState(false)

  async function fetchCategories() {
    const res = await fetch('/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setCategories(json.data)
    setLoaded(true)
  }

  useEffect(() => {
    fetchCategories()
  }, [token])

  async function handleAdd() {
    if (!newName.trim() || !newDisplayName.trim()) return
    await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        display_name: newDisplayName.trim(),
        icon: newIcon.trim() || '📁',
      }),
    })
    setNewName('')
    setNewDisplayName('')
    setNewIcon('')
    fetchCategories()
  }

  async function handleUpdate(id: string) {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        display_name: editForm.display_name,
        icon: editForm.icon,
      }),
    })
    setEditing(null)
    fetchCategories()
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu kategoriyi silmek istediginize emin misiniz?')) return
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    })
    fetchCategories()
  }

  if (!loaded) {
    return <div className="bg-[#1F1F1F] rounded-lg p-6 text-gray-500">Yukleniyor...</div>
  }

  return (
    <div className="bg-[#1F1F1F] rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Kategoriler</h2>

      {/* Add New */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          placeholder="Emoji"
          className="w-14 bg-black/30 text-white border border-gray-600 rounded px-2 py-2 text-sm text-center"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="slug (orn: devops)"
          className="w-32 bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
          placeholder="Goruntulenen ad (orn: DevOps & CI/CD)"
          className="flex-1 bg-black/30 text-white border border-gray-600 rounded px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 whitespace-nowrap"
        >
          + Ekle
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 bg-black/20 rounded px-3 py-2">
            {editing === cat.id ? (
              <>
                <input
                  type="text"
                  value={editForm.icon}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  className="w-10 bg-black/30 text-white border border-gray-600 rounded px-1 py-1 text-sm text-center"
                />
                <span className="text-gray-500 text-xs w-24 truncate">{cat.name}</span>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="flex-1 bg-black/30 text-white border border-gray-600 rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => handleUpdate(cat.id)}
                  className="text-green-400 text-xs hover:text-green-300"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="text-gray-400 text-xs hover:text-white"
                >
                  Iptal
                </button>
              </>
            ) : (
              <>
                <span className="text-lg w-8">{cat.icon}</span>
                <span className="text-gray-500 text-xs w-24 truncate">{cat.name}</span>
                <span className="text-white text-sm flex-1">{cat.display_name}</span>
                <button
                  onClick={() => {
                    setEditing(cat.id)
                    setEditForm({ display_name: cat.display_name, icon: cat.icon })
                  }}
                  className="text-gray-400 text-xs hover:text-white"
                >
                  Duzenle
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-red-400 text-xs hover:text-red-300"
                >
                  Sil
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-[10px] mt-3">
        AI analiz, projeyi bu kategorilerden biriyle eslestirir. Yeni kategori eklerseniz AI bir sonraki analizde kullanir.
      </p>
    </div>
  )
}
