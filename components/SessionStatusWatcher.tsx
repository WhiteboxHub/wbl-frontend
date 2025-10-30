// 'use client';

// import { useEffect } from 'react';
// import { useSession } from 'next-auth/react';
// import toast from 'react-hot-toast';

// export default function SessionStatusWatcher() {
//   const { data: session, status } = useSession();

//   useEffect(() => {
//     if (status === 'authenticated' && session?.user.status === 'inactive') {
//       toast.error('Error - Inactive account. Please contact admin.');
      
//       // Do NOT call signOut() here to prevent redirect
//     }
//   }, [session, status]);

//   return null;
// }
