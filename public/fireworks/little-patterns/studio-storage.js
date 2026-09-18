/* One local draft, no network requests or player identity. PNG encoding runs after play stops. */
(function(root){
  'use strict';
  root.StudioDraft = class {
    constructor(){this.db=null;this.opening=null;this.failed=false;}
    open(){
      if(this.opening)return this.opening;
      this.opening=new Promise((resolve,reject)=>{
        let done=false,request;
        const fail=()=>{if(done)return;done=true;this.failed=true;reject(Error('Local saving unavailable'));};
        const timer=setTimeout(fail,2500);
        try{request=indexedDB.open('nook-messy-studio',1);}catch(_){clearTimeout(timer);fail();return;}
        request.onupgradeneeded=()=>{request.result.createObjectStore('drafts');};
        request.onerror=request.onblocked=()=>{clearTimeout(timer);fail();};
        request.onsuccess=()=>{if(done){request.result.close();return;}clearTimeout(timer);done=true;const db=request.result;this.db=db;
          const reset=()=>{if(this.db===db){this.db=null;this.opening=null;this.failed=false;}};db.onclose=reset;db.onversionchange=()=>{db.close();reset();};resolve(db);};
      });
      return this.opening;
    }
    async read(){return this.perform('readonly',store=>store.get('picture'));}
    async write(blob,blank=false){const data=await blob.arrayBuffer();return this.perform('readwrite',store=>store.put({version:1,width:1600,height:1200,data,blank,savedAt:Date.now()},'picture'));}
    async perform(mode,action){for(let attempt=0;attempt<2;attempt++){try{return await this.transaction(await this.open(),mode,action);}catch(e){if(attempt===0&&['InvalidStateError','AbortError'].includes(e.name)){if(this.db)this.db.close();this.db=null;this.opening=null;this.failed=false;}else throw e;}}}
    transaction(db,mode,action){return new Promise((resolve,reject)=>{
      let result,done=false,tx;
      const fail=error=>{if(done)return;done=true;this.failed=true;reject(error||Error('Local draft unavailable'));};
      const timer=setTimeout(()=>{try{tx.abort();}catch(_){}fail();},3000);
      try{tx=db.transaction('drafts',mode);const req=action(tx.objectStore('drafts'));req.onsuccess=()=>{result=req.result;};
        tx.oncomplete=()=>{if(done)return;done=true;clearTimeout(timer);resolve(result);};
        tx.onabort=tx.onerror=()=>{clearTimeout(timer);fail(tx.error);};
      }catch(error){clearTimeout(timer);fail(error);}
    });}
  };
})(window);
