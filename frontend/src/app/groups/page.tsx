'use client'

import React, {useEffect, useState} from 'react'
import {createBrowserClient} from '@supabase/ssr'
import Link from 'next/link'
import type {Group} from '@/types/api'

import {ChaoticOrbit} from 'ldrs/react'
import 'ldrs/react/ChaoticOrbit.css'
import {buttonClass} from '@/utils/styles'

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [groupName, setGroupName] = useState('')
    const [creating, setCreating] = useState(false)


    // Fetch groups function extracted
    const fetchGroups = async () => {
        setLoading(true)
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const {
            data: { session },
        } = await supabase.auth.getSession()

        const token = session?.access_token
        if (!token) {
            setGroups([])
            setLoading(false)
            return
        }

        try {
            const res = await fetch('http://localhost:8080/v1/groups', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!res.ok) throw new Error('Failed to fetch groups')

            const json = await res.json()
            setGroups(Array.isArray(json.data) ? json.data : [])
        } catch (err) {
            console.error('Error fetching groups:', err)
            setGroups([])
        } finally {
            setLoading(false)
        }
    }

    // Run once on mount
    useEffect(() => {
        fetchGroups()
    }, [])

    // Handle create form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!groupName.trim()) return
        setCreating(true)

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const {
            data: { session },
        } = await supabase.auth.getSession()

        const token = session?.access_token
        if (!token) {
            alert('Not authenticated')
            setCreating(false)
            return
        }

        try {
            const res = await fetch('http://localhost:8080/v1/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: groupName.trim() }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.message || 'Failed to create group')
            }

            setGroupName('')
            await fetchGroups()
        } catch (error) {
            alert(String(error))
        } finally {
            setCreating(false)
        }
    }

    if (loading)
        return (
            <main className="flex flex-col items-center bg-white">
                <div className="flex w-[90vw] md:w-[92.5vw] lg:w-[95vw] flex-col gap-6 items-center justify-center h-screen">
                    <ChaoticOrbit size="35" speed="1.5" color="#1F2937" />
                    <h1 className="text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold text-center">Loading...</h1>
                </div>
            </main>
        )

    return (
        <main className="flex flex-col items-center bg-white">
            <div className="w-[90vw] md:w-[92.5vw] lg:w-[95vw] py-24 flex flex-col gap-12">
                <section className="flex flex-col gap-3">
                    <h1 className="md:w-3/4 lg:w-2/4 text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold">Create Group</h1>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            disabled={creating}
                            className="rounded-lg md:col-span-3 border border-neutral-200 px-4 py-2"
                            required
                            minLength={2}
                            maxLength={50}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={creating}
                            className={`${buttonClass} col-span-1 rounded-lg disabled:opacity-50`}
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </form>
                </section>

                <section className="flex flex-col gap-3">
                    <h1 className="md:w-3/4 lg:w-2/4 text-gray-800 text-2xl md:text-3xl lg:text-4xl font-bold">Your Groups</h1>
                    {groups.length === 0 ? (
                        <p className="text-gray-800 opacity-50">No groups found.</p>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((group) => (
                                <li key={group.ID} className="p-4 flex flex-col gap-1 text-gray-800 rounded-lg border border-neutral-200">
                                    <h3 className="md:w-3/4 lg:w-2/4 text-gray-800 text-lg md:text-xl font-bold">{group.Name}</h3>
                                    <Link href={`/groups/${encodeURIComponent(group.ID)}`}>
                                        <button className={`${buttonClass} w-full md:w-auto`}>View</button>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
