import React, { useEffect, useState } from 'react';
export function SillyComponent({ userId }: { userId: string }) {
  const [data, setData] = useState(null);
  
  // React Hook Bug: missing userId in dependency array
  useEffect(() => {
    fetch('/api/users/' + userId).then(res => res.json()).then(setData);
  }, []); // silly mistake!

  // Hardcoded Secret Rule violation
   // silly mistake!

  return <div>{data ? data.name : 'Loading...'}</div>;
}

