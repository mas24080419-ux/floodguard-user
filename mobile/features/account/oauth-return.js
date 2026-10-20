
(()=>{
  const q=new URLSearchParams(location.search);
  const h=new URLSearchParams(location.hash.slice(1));
  if(h.has('access_token')||h.has('error')||q.has('code')||q.has('error')){
    document.documentElement.classList.add('fg-auth-return');
  }
})();
