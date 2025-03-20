import React, { useEffect, useState } from 'react'
import { useChatStore } from '../../store/useChatStore'
import SidebarSkeleton from '../Skeletons/SidebarSkeleton';
import { Search,Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Sidebar = () => {
    const {getUsers, users, selectedUser, setSelectedUser, isUsersLoading, } = useChatStore();
    const {onlineUsers} = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlineOnly,setShowOnlineOnly] = useState(false);

 
    useEffect(()=>{
        getUsers()
    },[getUsers])

    const filteredUsers = users
                       //for online only
                      .filter(user => showOnlineOnly ? onlineUsers.includes(user._id) : true)
                      //search query
                      .filter(user => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    



    if(isUsersLoading) return <SidebarSkeleton />
    return (
        <aside className="h-full w-27 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
          <div className="border-b border-base-300 w-full pt-4 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <Users className="size-6 ml-5" />
              <span className="font-medium lg:block">Contacts</span>
            </div>
      
            <div className='mt-3 ml-5 hidden lg:flex items-center gap-2'>
              <label className='cursor-pointer flex items-center gap-2'>
                <input type="checkbox" checked={showOnlineOnly} 
                      onChange={(e)=> setShowOnlineOnly(e.target.checked)}
                      className='checkbox checkbox-xs '
                />
                <span className='text-xs'>Show online only</span>
              </label>
              <span className='text-xs text-zinc-500'>({onlineUsers.length - 1} online)</span>
            </div>
      
            <div className="px-2 my-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 lg:px-4 py-1.5 lg:py-2 text-sm lg:text-base
                           bg-base-200 rounded-lg pr-8 lg:pr-10 
                           focus:outline-none focus:ring-2 
                           focus:ring-base-300 transition-all"
                />
                <Search className="absolute right-2 lg:right-3 top-1/2 transform 
                               -translate-y-1/2 text-zinc-400 
                               size-4 lg:size-5" />
              </div>
            </div>
          
            {/* Here's the scrollable container with the scrollbar-thin class */}
            <div className='overflow-y-auto w-full py-3 flex-grow scrollbar-thin'>
              {filteredUsers.length !== 0 ? (
                filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`
                      w-full px-2 py-3 flex items-center gap-3
                      hover:bg-base-300 transition-colors
                      ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                    `}
                  >
                    <div className="relative flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14">
                      {user.profilePic ? (
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.name}
                          className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center font-bold text-2xl border-2 rounded-full w-full h-full bg-gray-500">
                          {user.fullName?.charAt(0) || "?"}
                        </span>
                      )}
                      {onlineUsers.includes(user._id) && (
                        <span className="absolute bottom-0.5 right-1 lg:right-2 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                      )}
                    </div>
      
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium truncate text-sm lg:text-base">
                        {user.fullName}
                      </div>
                      <div className="text-xs lg:text-sm text-zinc-400">
                        {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className='text-center text-zinc-500 py-4'>No users found</div>
              )}
            </div>
          </div>
        </aside>
      )
}

export default Sidebar