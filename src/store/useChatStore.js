import {create} from "zustand"
import toast from "react-hot-toast";
import { axiosIntance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";


export const useChatStore = create((set,get)=>({
    messages:[],
    users:[],
    selectedUser:null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isClearingChat: false,
    isTyping: false,  
    typingTimeout: null,
    loading: false,
    error: null,


    getUsers: async() =>{
        set({isUsersLoading: true});
        try{
          const res = await axiosIntance.get("/message/users");
          set({users:res.data});
        }catch(error){
            toast.error(error.response.data.message);
        }finally{
            set({isUsersLoading:false})
        }
    },

    getMessages: async(userId)=>{
        if (!userId) return;
        set({isMessagesLoading:true});
        try{
           const res = await axiosIntance.get(`/message/${userId}`)
           set({messages:res.data})
        }catch(error){
            toast.error(error.response.data.message);
        }finally{
            set({isMessagesLoading:false})
        }
    },

    sendMessage: async ({ text, image }) => {
        const { selectedUser } = get();
        
        if (!selectedUser) {
          throw new Error('No user selected');
        }
        
        set({ loading: true });
        
        try {
          const response = await axiosIntance.post(
            `/message/send/${selectedUser._id}`,
            { text, image },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          // Add new message to the messages array
          set(state => ({
            messages: [...state.messages, response.data],
            loading: false,
            error: null
          }));
          
          return response.data;
        } catch (error) {
          set({ loading: false, error: error.response?.data || error.message });
          
          // Important: Re-throw the error so the component can handle it
          throw error;
        }
      },

    subscribeToMessages:()=>{
        const{selectedUser} = get();
        if(!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;


        socket.on('newMessage', (newMessage)=>{
            if(newMessage.senderId !== selectedUser._id) return;
          set({
            messages: [...get().messages, newMessage],
            isTyping: false 
          })
        })
        get().subscribeToTyping();
    },

    unsubscribeFromMessages: ()=>{
         const socket =useAuthStore.getState().socket; 
         if (!socket) return;

         socket.off('newMessage');
         get().unsubscribeFromTyping();
    },

    sendTypingStatus: () => {
        const { selectedUser, typingTimeout } = get();
        if (!selectedUser) return;
        
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        // Clear any existing timeout
        if (typingTimeout) clearTimeout(typingTimeout);
        
        // Emit typing event
        socket.emit("typing", { recipientId: selectedUser._id });

        const timeout = setTimeout(() => {
            socket.emit("stopTyping", { recipientId: selectedUser._id });
        }, 2000);
        
        set({ typingTimeout: timeout });
    },

    subscribeToTyping: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;
        
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        socket.on("userTyping", (data) => {
            if (data.senderId === selectedUser._id) {
                set({ isTyping: true });
            }
        });
        
        socket.on("userStopTyping", (data) => {
            if (data.senderId === selectedUser._id) {
                set({ isTyping: false });
            }
        });
    },

    unsubscribeFromTyping: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        
        socket.off("userTyping");
        socket.off("userStopTyping");
        
        const { typingTimeout } = get();
        if (typingTimeout) clearTimeout(typingTimeout);
        
        set({ isTyping: false, typingTimeout: null });
    }, 

    clearChat: async (userId) => {
        set({ isClearingChat: true });
        try {
          await axiosIntance.post("/message/clear", { userId });
          
          // Clear messages in local state
          set({ messages: [] });
          
          // Optional: Notify the socket about cleared chat
          const { socket } = useAuthStore.getState();
          if (socket) {
            socket.emit("chatCleared", { 
              receiverId: userId,
              senderId: useAuthStore.getState().authUser._id 
            });
          }
          
          return true;
        } catch (error) {
          console.error("Error clearing chat:", error);
          toast.error("Failed to clear chat");
          return false;
        } finally {
          set({ isClearingChat: false });
        }
    },

    setSelectedUser: (selectedUser)=> set({selectedUser})
}))