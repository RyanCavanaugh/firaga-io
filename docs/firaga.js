"use strict";(()=>{var Re=Object.defineProperty;var jr=Object.getOwnPropertyDescriptor;var Kr=Object.getOwnPropertyNames;var Yr=Object.prototype.hasOwnProperty;var qr=(e,t)=>()=>(e&&(t=e(e=0)),t);var W=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),Xr=(e,t)=>{for(var r in t)Re(e,r,{get:t[r],enumerable:!0})},Jr=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of Kr(t))!Yr.call(e,a)&&a!==r&&Re(e,a,{get:()=>t[a],enumerable:!(n=jr(t,a))||n.enumerable});return e};var gt=e=>Jr(Re({},"__esModule",{value:!0}),e);var Ce={};Xr(Ce,{Component:()=>le,Fragment:()=>V,cloneElement:()=>an,createContext:()=>Ne,createElement:()=>de,createRef:()=>Qr,h:()=>de,hydrate:()=>Et,isValidElement:()=>bt,options:()=>P,render:()=>pe,toChildArray:()=>xt});function T(e,t){for(var r in t)e[r]=t[r];return e}function $e(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function de(e,t,r){var n,a,o,i={};for(o in t)o=="key"?n=t[o]:o=="ref"?a=t[o]:i[o]=t[o];if(arguments.length>2&&(i.children=arguments.length>3?ce.call(arguments,2):r),typeof e=="function"&&e.defaultProps!=null)for(o in e.defaultProps)i[o]===void 0&&(i[o]=e.defaultProps[o]);return ie(e,i,n,a,null)}function ie(e,t,r,n,a){var o={type:e,props:t,key:r,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:a??++_t,__i:-1,__u:0};return a==null&&P.vnode!=null&&P.vnode(o),o}function Qr(){return{current:null}}function V(e){return e.children}function le(e,t){this.props=e,this.context=t}function Q(e,t){if(t==null)return e.__?Q(e.__,e.__i+1):null;for(var r;t<e.__k.length;t++)if((r=e.__k[t])!=null&&r.__e!=null)return r.__e;return typeof e.type=="function"?Q(e):null}function At(e){var t,r;if((e=e.__)!=null&&e.__c!=null){for(e.__e=e.__c.base=null,t=0;t<e.__k.length;t++)if((r=e.__k[t])!=null&&r.__e!=null){e.__e=e.__c.base=r.__e;break}return At(e)}}function Ve(e){(!e.__d&&(e.__d=!0)&&q.push(e)&&!be.__r++||ft!=P.debounceRendering)&&((ft=P.debounceRendering)||Ct)(be)}function be(){for(var e,t,r,n,a,o,i,d=1;q.length;)q.length>d&&q.sort(vt),e=q.shift(),d=q.length,e.__d&&(r=void 0,n=void 0,a=(n=(t=e).__v).__e,o=[],i=[],t.__P&&((r=T({},n)).__v=n.__v+1,P.vnode&&P.vnode(r),He(t.__P,r,n,t.__n,t.__P.namespaceURI,32&n.__u?[a]:null,o,a??Q(n),!!(32&n.__u),i),r.__v=n.__v,r.__.__k[r.__i]=r,Pt(o,r,i),n.__e=n.__=null,r.__e!=a&&At(r)));be.__r=0}function Bt(e,t,r,n,a,o,i,d,p,c,s){var u,f,g,m,C,v,b,h=n&&n.__k||kt,_=t.length;for(p=en(r,t,h,p,_),u=0;u<_;u++)(g=r.__k[u])!=null&&(f=g.__i==-1?se:h[g.__i]||se,g.__i=u,v=He(e,g,f,a,o,i,d,p,c,s),m=g.__e,g.ref&&f.ref!=g.ref&&(f.ref&&Ue(f.ref,null,g),s.push(g.ref,g.__c||m,g)),C==null&&m!=null&&(C=m),(b=!!(4&g.__u))||f.__k===g.__k?p=St(g,p,e,b):typeof g.type=="function"&&v!==void 0?p=v:m&&(p=m.nextSibling),g.__u&=-7);return r.__e=C,p}function en(e,t,r,n,a){var o,i,d,p,c,s=r.length,u=s,f=0;for(e.__k=new Array(a),o=0;o<a;o++)(i=t[o])!=null&&typeof i!="boolean"&&typeof i!="function"?(typeof i=="string"||typeof i=="number"||typeof i=="bigint"||i.constructor==String?i=e.__k[o]=ie(null,i,null,null,null):ue(i)?i=e.__k[o]=ie(V,{children:i},null,null,null):i.constructor===void 0&&i.__b>0?i=e.__k[o]=ie(i.type,i.props,i.key,i.ref?i.ref:null,i.__v):e.__k[o]=i,p=o+f,i.__=e,i.__b=e.__b+1,d=null,(c=i.__i=tn(i,r,p,u))!=-1&&(u--,(d=r[c])&&(d.__u|=2)),d==null||d.__v==null?(c==-1&&(a>s?f--:a<s&&f++),typeof i.type!="function"&&(i.__u|=4)):c!=p&&(c==p-1?f--:c==p+1?f++:(c>p?f--:f++,i.__u|=4))):e.__k[o]=null;if(u)for(o=0;o<s;o++)(d=r[o])!=null&&(2&d.__u)==0&&(d.__e==n&&(n=Q(d)),Ft(d,d));return n}function St(e,t,r,n){var a,o;if(typeof e.type=="function"){for(a=e.__k,o=0;a&&o<a.length;o++)a[o]&&(a[o].__=e,t=St(a[o],t,r,n));return t}e.__e!=t&&(n&&(t&&e.type&&!t.parentNode&&(t=Q(e)),r.insertBefore(e.__e,t||null)),t=e.__e);do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function xt(e,t){return t=t||[],e==null||typeof e=="boolean"||(ue(e)?e.some(function(r){xt(r,t)}):t.push(e)),t}function tn(e,t,r,n){var a,o,i,d=e.key,p=e.type,c=t[r],s=c!=null&&(2&c.__u)==0;if(c===null&&d==null||s&&d==c.key&&p==c.type)return r;if(n>(s?1:0)){for(a=r-1,o=r+1;a>=0||o<t.length;)if((c=t[i=a>=0?a--:o++])!=null&&(2&c.__u)==0&&d==c.key&&p==c.type)return i}return-1}function mt(e,t,r){t[0]=="-"?e.setProperty(t,r??""):e[t]=r==null?"":typeof r!="number"||Zr.test(t)?r:r+"px"}function _e(e,t,r,n,a){var o,i;e:if(t=="style")if(typeof r=="string")e.style.cssText=r;else{if(typeof n=="string"&&(e.style.cssText=n=""),n)for(t in n)r&&t in r||mt(e.style,t,"");if(r)for(t in r)n&&r[t]==n[t]||mt(e.style,t,r[t])}else if(t[0]=="o"&&t[1]=="n")o=t!=(t=t.replace(wt,"$1")),i=t.toLowerCase(),t=i in e||t=="onFocusOut"||t=="onFocusIn"?i.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+o]=r,r?n?r.u=n.u:(r.u=ze,e.addEventListener(t,o?Te:Ie,o)):e.removeEventListener(t,o?Te:Ie,o);else{if(a=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=r??"";break e}catch{}typeof r=="function"||(r==null||r===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&r==1?"":r))}}function yt(e){return function(t){if(this.l){var r=this.l[t.type+e];if(t.t==null)t.t=ze++;else if(t.t<r.u)return;return r(P.event?P.event(t):t)}}}function He(e,t,r,n,a,o,i,d,p,c){var s,u,f,g,m,C,v,b,h,_,k,y,D,w,B,x,A,S=t.type;if(t.constructor!==void 0)return null;128&r.__u&&(p=!!(32&r.__u),o=[d=t.__e=r.__e]),(s=P.__b)&&s(t);e:if(typeof S=="function")try{if(b=t.props,h="prototype"in S&&S.prototype.render,_=(s=S.contextType)&&n[s.__c],k=s?_?_.props.value:s.__:n,r.__c?v=(u=t.__c=r.__c).__=u.__E:(h?t.__c=u=new S(b,k):(t.__c=u=new le(b,k),u.constructor=S,u.render=nn),_&&_.sub(u),u.state||(u.state={}),u.__n=n,f=u.__d=!0,u.__h=[],u._sb=[]),h&&u.__s==null&&(u.__s=u.state),h&&S.getDerivedStateFromProps!=null&&(u.__s==u.state&&(u.__s=T({},u.__s)),T(u.__s,S.getDerivedStateFromProps(b,u.__s))),g=u.props,m=u.state,u.__v=t,f)h&&S.getDerivedStateFromProps==null&&u.componentWillMount!=null&&u.componentWillMount(),h&&u.componentDidMount!=null&&u.__h.push(u.componentDidMount);else{if(h&&S.getDerivedStateFromProps==null&&b!==g&&u.componentWillReceiveProps!=null&&u.componentWillReceiveProps(b,k),t.__v==r.__v||!u.__e&&u.shouldComponentUpdate!=null&&u.shouldComponentUpdate(b,u.__s,k)===!1){for(t.__v!=r.__v&&(u.props=b,u.state=u.__s,u.__d=!1),t.__e=r.__e,t.__k=r.__k,t.__k.some(function(F){F&&(F.__=t)}),y=0;y<u._sb.length;y++)u.__h.push(u._sb[y]);u._sb=[],u.__h.length&&i.push(u);break e}u.componentWillUpdate!=null&&u.componentWillUpdate(b,u.__s,k),h&&u.componentDidUpdate!=null&&u.__h.push(function(){u.componentDidUpdate(g,m,C)})}if(u.context=k,u.props=b,u.__P=e,u.__e=!1,D=P.__r,w=0,h){for(u.state=u.__s,u.__d=!1,D&&D(t),s=u.render(u.props,u.state,u.context),B=0;B<u._sb.length;B++)u.__h.push(u._sb[B]);u._sb=[]}else do u.__d=!1,D&&D(t),s=u.render(u.props,u.state,u.context),u.state=u.__s;while(u.__d&&++w<25);u.state=u.__s,u.getChildContext!=null&&(n=T(T({},n),u.getChildContext())),h&&!f&&u.getSnapshotBeforeUpdate!=null&&(C=u.getSnapshotBeforeUpdate(g,m)),x=s,s!=null&&s.type===V&&s.key==null&&(x=Lt(s.props.children)),d=Bt(e,ue(x)?x:[x],t,r,n,a,o,i,d,p,c),u.base=t.__e,t.__u&=-161,u.__h.length&&i.push(u),v&&(u.__E=u.__=null)}catch(F){if(t.__v=null,p||o!=null)if(F.then){for(t.__u|=p?160:128;d&&d.nodeType==8&&d.nextSibling;)d=d.nextSibling;o[o.indexOf(d)]=null,t.__e=d}else{for(A=o.length;A--;)$e(o[A]);Oe(t)}else t.__e=r.__e,t.__k=r.__k,F.then||Oe(t);P.__e(F,t,r)}else o==null&&t.__v==r.__v?(t.__k=r.__k,t.__e=r.__e):d=t.__e=rn(r.__e,t,r,n,a,o,i,p,c);return(s=P.diffed)&&s(t),128&t.__u?void 0:d}function Oe(e){e&&e.__c&&(e.__c.__e=!0),e&&e.__k&&e.__k.forEach(Oe)}function Pt(e,t,r){for(var n=0;n<r.length;n++)Ue(r[n],r[++n],r[++n]);P.__c&&P.__c(t,e),e.some(function(a){try{e=a.__h,a.__h=[],e.some(function(o){o.call(a)})}catch(o){P.__e(o,a.__v)}})}function Lt(e){return typeof e!="object"||e==null||e.__b&&e.__b>0?e:ue(e)?e.map(Lt):T({},e)}function rn(e,t,r,n,a,o,i,d,p){var c,s,u,f,g,m,C,v=r.props||se,b=t.props,h=t.type;if(h=="svg"?a="http://www.w3.org/2000/svg":h=="math"?a="http://www.w3.org/1998/Math/MathML":a||(a="http://www.w3.org/1999/xhtml"),o!=null){for(c=0;c<o.length;c++)if((g=o[c])&&"setAttribute"in g==!!h&&(h?g.localName==h:g.nodeType==3)){e=g,o[c]=null;break}}if(e==null){if(h==null)return document.createTextNode(b);e=document.createElementNS(a,h,b.is&&b),d&&(P.__m&&P.__m(t,o),d=!1),o=null}if(h==null)v===b||d&&e.data==b||(e.data=b);else{if(o=o&&ce.call(e.childNodes),!d&&o!=null)for(v={},c=0;c<e.attributes.length;c++)v[(g=e.attributes[c]).name]=g.value;for(c in v)if(g=v[c],c!="children"){if(c=="dangerouslySetInnerHTML")u=g;else if(!(c in b)){if(c=="value"&&"defaultValue"in b||c=="checked"&&"defaultChecked"in b)continue;_e(e,c,null,g,a)}}for(c in b)g=b[c],c=="children"?f=g:c=="dangerouslySetInnerHTML"?s=g:c=="value"?m=g:c=="checked"?C=g:d&&typeof g!="function"||v[c]===g||_e(e,c,g,v[c],a);if(s)d||u&&(s.__html==u.__html||s.__html==e.innerHTML)||(e.innerHTML=s.__html),t.__k=[];else if(u&&(e.innerHTML=""),Bt(t.type=="template"?e.content:e,ue(f)?f:[f],t,r,n,h=="foreignObject"?"http://www.w3.org/1999/xhtml":a,o,i,o?o[0]:r.__k&&Q(r,0),d,p),o!=null)for(c=o.length;c--;)$e(o[c]);d||(c="value",h=="progress"&&m==null?e.removeAttribute("value"):m!=null&&(m!==e[c]||h=="progress"&&!m||h=="option"&&m!=v[c])&&_e(e,c,m,v[c],a),c="checked",C!=null&&C!=e[c]&&_e(e,c,C,v[c],a))}return e}function Ue(e,t,r){try{if(typeof e=="function"){var n=typeof e.__u=="function";n&&e.__u(),n&&t==null||(e.__u=e(t))}else e.current=t}catch(a){P.__e(a,r)}}function Ft(e,t,r){var n,a;if(P.unmount&&P.unmount(e),(n=e.ref)&&(n.current&&n.current!=e.__e||Ue(n,null,t)),(n=e.__c)!=null){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(o){P.__e(o,t)}n.base=n.__P=null}if(n=e.__k)for(a=0;a<n.length;a++)n[a]&&Ft(n[a],t,r||typeof e.type!="function");r||$e(e.__e),e.__c=e.__=e.__e=void 0}function nn(e,t,r){return this.constructor(e,r)}function pe(e,t,r){var n,a,o,i;t==document&&(t=document.documentElement),P.__&&P.__(e,t),a=(n=typeof r=="function")?null:r&&r.__k||t.__k,o=[],i=[],He(t,e=(!n&&r||t).__k=de(V,null,[e]),a||se,se,t.namespaceURI,!n&&r?[r]:a?null:t.firstChild?ce.call(t.childNodes):null,o,!n&&r?r:a?a.__e:t.firstChild,n,i),Pt(o,e,i)}function Et(e,t){pe(e,t,Et)}function an(e,t,r){var n,a,o,i,d=T({},e.props);for(o in e.type&&e.type.defaultProps&&(i=e.type.defaultProps),t)o=="key"?n=t[o]:o=="ref"?a=t[o]:d[o]=t[o]===void 0&&i!=null?i[o]:t[o];return arguments.length>2&&(d.children=arguments.length>3?ce.call(arguments,2):r),ie(e.type,d,n||e.key,a||e.ref,null)}function Ne(e){function t(r){var n,a;return this.getChildContext||(n=new Set,(a={})[t.__c]=this,this.getChildContext=function(){return a},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(o){this.props.value!=o.value&&n.forEach(function(i){i.__e=!0,Ve(i)})},this.sub=function(o){n.add(o);var i=o.componentWillUnmount;o.componentWillUnmount=function(){n&&n.delete(o),i&&i.call(o)}}),r.children}return t.__c="__cC"+Dt++,t.__=e,t.Provider=t.__l=(t.Consumer=function(r,n){return r.children(n)}).contextType=t,t}var ce,P,_t,bt,q,ft,Ct,vt,wt,ze,Ie,Te,Dt,se,kt,Zr,ue,j=qr(()=>{se={},kt=[],Zr=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ue=Array.isArray;ce=kt.slice,P={__e:function(e,t,r,n){for(var a,o,i;t=t.__;)if((a=t.__c)&&!a.__)try{if((o=a.constructor)&&o.getDerivedStateFromError!=null&&(a.setState(o.getDerivedStateFromError(e)),i=a.__d),a.componentDidCatch!=null&&(a.componentDidCatch(e,n||{}),i=a.__d),i)return a.__E=a}catch(d){e=d}throw e}},_t=0,bt=function(e){return e!=null&&e.constructor===void 0},le.prototype.setState=function(e,t){var r;r=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=T({},this.state),typeof e=="function"&&(e=e(T({},r),this.props)),e&&T(r,e),e!=null&&this.__v&&(t&&this._sb.push(t),Ve(this))},le.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),Ve(this))},le.prototype.render=V,q=[],Ct=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,vt=function(e,t){return e.__v.__b-t.__v.__b},be.__r=0,wt=/(PointerCapture)$|Capture$/i,ze=0,Ie=yt(!1),Te=yt(!0),Dt=0});var Kt=W((Sa,pn)=>{pn.exports=`R,G,B,Name,Artkal Midi,Artkal Mini,Artkal Mini Starter,Artkal Midi Soft,Artkal Mini Soft,All Perler,Perler Multi Mix,Perler Mini Assorted,Perler Mini Bulk,EvoRetro,Funzbo\r
255,255,255,White,S01,C01,C01,R01,A01,,,,,,\r
255,163,139,Burning Sand,S02,C44,C44,R02,A44,,,,,,\r
246,176,76,Tangerine,S03,C03,C03,R03,A03,,,,,,\r
255,103,31,Orange,S04,C17,C17,R04,A17,,,,,,\r
225,6,0,Tall Poppy,S05,C05,C05,R05,A05,,,,,,\r
236,134,208,Raspberry Pink,S06,C49,,R06,A49,,,,,,\r
155,155,155,Gray,S07,C33,C33,R07,A33,,,,,,\r
36,222,91,Emerald,S08,,,R08,,,,,,,\r
0,104,94,Dark Green,S09,,,R09,,,,,,,\r
65,182,230,Baby Blue,S10,C19,C19,R10,A19,,,,,,\r
79,159,179,Lagoon,S100,C99,,,A99,,,,,,\r
49,150,221,Electric Blue,S101,C100,,,A100,,,,,,\r
27,108,182,Pool Blue,S102,C101,,,A101,,,,,,\r
8,57,128,Caribbean Blue,S103,C102,,,A102,,,,,,\r
10,102,139,Deep Water,S104,C103,,,A103,,,,,,\r
8,91,110,Petrol Blue,S105,C104,,,A104,,,,,,\r
0,78,120,Wegdewood Blue,S106,C105,,,A105,,,,,,\r
0,85,116,Pond Blue,S107,C106,,,A106,,,,,,\r
204,190,128,Seashell Beige,S108,C107,,,A107,,,,,,\r
164,147,80,Beige,S109,C108,,,A108,,,,,,\r
0,51,153,Dark Blue,S11,C21,C21,R11,A21,,,,,,\r
158,136,60,Beach Beige,S110,C109,,,A109,,,,,,\r
118,108,43,Caffe Latt\xE9,S111,C110,,,A110,,,,,,\r
121,95,38,Oaktree Brown,S112,C111,,,A111,,,,,,\r
186,184,162,Khaki,S113,C112,,,A112,,,,,,\r
114,140,84,Light Greengray,S114,C113,,,A113,,,,,,\r
126,124,68,Mossy Green,S115,C114,,,A114,,,,,,\r
100,105,46,Earth Green,S116,C115,,,A115,,,,,,\r
78,88,44,Sage Green,S117,C116,,,A116,,,,,,\r
74,94,45,Pinetree Green,S118,C117,,,A117,,,,,,\r
113,196,182,Frosty Blue,S119,C118,,,A118,,,,,,\r
160,94,181,Pastel Lavender,S12,C26,C26,R12,A26,,,,,,\r
102,204,153,Polar Mint,S120,C119,,,A119,,,,,,\r
86,154,131,Celadon Green,S121,C120,,,A120,,,,,,\r
20,194,91,Eucalyptus,S122,C121,,,A121,,,,,,\r
24,168,24,Clover Field,S123,C122,,,A122,,,,,,\r
4,85,46,Pooltable Felt,S124,C123,,,A123,,,,,,\r
19,107,90,Snake Green,S125,C124,,,A124,,,,,,\r
5,70,65,Dark Eucalyptus,S126,C125,,,A125,,,,,,\r
217,182,214,Marsmallow Rose,S127,C126,,,A126,,,,,,\r
173,98,164,Light Grape,S128,C127,,,A127,,,,,,\r
230,140,163,Rosebud Pink,S129,C128,,,A128,,,,,,\r
0,0,0,Black,S13,C02,C02,R13,A02,,,,,,\r
222,84,121,Fuschia,S130,C129,,,A129,,,,,,\r
158,130,186,Candy Violet,S131,C130,,,A130,,,,,,\r
232,65,107,Flamingo,S132,C131,,,A131,,,,,,\r
183,56,143,Pink Plum,S133,C132,,,A132,,,,,,\r
88,31,126,Amethyst,S134,C133,,,A133,,,,,,\r
140,163,212,Moonlight Blue,S135,C134,,,A134,,,,,,\r
154,154,204,Summer Rain,S136,C135,,,A135,,,,,,\r
89,129,193,Azure Blue,S137,C136,,,A136,,,,,,\r
65,102,176,Cornflower Blue,S138,C137,,,A137,,,,,,\r
71,95,171,Forget Me Not,S139,C138,,,A138,,,,,,\r
250,224,83,Sandstorm,S14,C42,C42,R14,A42,,,,,,\r
55,69,147,Indigo,S140,C139,,,A139,,,,,,\r
61,86,165,Horizon Blue,S141,C140,,,A140,,,,,,\r
41,66,135,Cobalt,S142,C141,,,A141,,,,,,\r
37,38,138,Royal Blue,S143,C142,,,A142,,,,,,\r
26,47,111,Marine,S144,C143,,,A143,,,,,,\r
211,201,93,Pale Yellow Moss,S145,C144,,,A144,,,,,,\r
81,9,24,Bloodrose Red,S146,C145,,,A145,,,,,,\r
100,179,158,Spearmint,S147,C146,,,A146,,,,,,\r
99,67,56,Mocha,S148,C147,,,A147,,,,,,\r
237,211,158,Creme,S149,C148,,,A148,,,,,,\r
122,62,44,Redwood,S15,C30,,R15,A30,,,,,,\r
105,99,171,Iris Violet,S150,C149,,,A149,,,,,,\r
43,63,31,Forest Green,S151,C150,,,A150,,,,,,\r
151,145,197,Lilac,S152,C151,,,A151,,,,,,\r
184,189,224,Pale Lilac,S153,C152,,,A152,,,,,,\r
249,200,152,Sahara Sand,S154,C153,,,A153,,,,,,\r
195,144,105,Sunkissed Teint,S155,C154,,,A154,,,,,,\r
90,90,90,Steel Grey,S156,C155,,,A155,,,,,,\r
60,60,60,Iron Grey,S157,C156,,,A156,,,,,,\r
26,26,26,Pepper,S158,C157,,,A157,,,,,,\r
139,139,139,Oslo Gray,S159,C56,,,A56,,,,,,\r
92,71,56,Brown,S16,C32,C32,R16,A32,,,,,,\r
123,77,53,Light Brown,S17,C31,C31,R17,A31,,,,,,\r
204,153,102,Sand,S18,C23,C23,R18,A23,,,,,,\r
252,191,169,Bubble Gum,S19,C22,C22,R19,A22,,,,,,\r
36,158,107,Green,S20,C14,,R20,A14,,,,,,\r
135,216,57,Pastel Green,S21,C13,C13,R21,A13,,,,,,\r
51,0,114,Purple,S22,C27,C27,R22,A27,,,,,,\r
100,53,155,Royal Purple,S23,,,R23,,,,,,,\r
20,123,209,True Blue,S24,C37,C37,R24,A37,,,,,,\r
255,52,179,Hot Pink,S25,C08,,R25,A08,,,,,,\r
219,33,82,Magenta,S26,C09,C09,R26,A09,,,,,,\r
255,209,0,Yellow,S27,C11,,R27,A11,,,,,,\r
234,184,228,Lily Pink,S28,,,R28,,,,,,,\r
246,235,97,Pastel Yellow,S29,C41,,R29,A41,,,,,,\r
153,214,234,Shadow Green,S30,C39,C39,R30,A39,,,,,,\r
158,229,176,Sea Mist,S31,C60,C60,R31,A60,,,,,,\r
255,231,128,Beeswax,S32,C24,,R32,A24,,,,,,\r
197,180,227,Maverick,S33,C50,C50,R33,A50,,,,,,\r
186,12,47,Red,S34,C06,,R34,A06,,,,,,\r
247,206,215,Mona Lisa,S35,,,R35,,,,,,,\r
201,128,158,Old Pink,S36,C36,,R36,A36,,,,,,\r
113,216,191,Blue-Green,S37,,,R37,,,,,,,\r
171,37,86,Burgundy,S38,,,R38,,,,,,,\r
237,139,0,Yellow Orange,S39,C04,C04,R39,A04,,,,,,\r
241,167,220,Carnation Pink,S40,C07,C07,R40,A07,,,,,,\r
154,85,22,Metallic Gold,S41,,,R41,,,,,,,\r
125,124,121,Metallic Silver,S42,C35,,R42,A35,,,,,,\r
118,119,119,Dark Gray,S43,C34,C34,R43,A34,,,,,,\r
170,220,235,Sky Blue,S44,C18,,R44,A18,,,,,,\r
0,178,169,Medium Turquoise,S45,C54,C54,R45,A54,,,,,,\r
115,211,60,Bright Green,S46,C53,,R46,A53,,,,,,\r
180,126,0,Marigold,S47,C28,,R47,A28,,,,,,\r
255,199,44,Corn,S48,C48,C48,R48,A48,,,,,,\r
114,25,95,Mulberry Wood,S49,,,R49,,,,,,,\r
250,170,114,Mandy's Pink,S50,,,R50,,,,,,,\r
252,251,205,Spring Sun,S51,C51,C51,R51,A51,,,,,,\r
242,240,161,Picasso,S52,C10,C10,R52,A10,,,,,,\r
105,179,231,Turquoise,S53,C38,C38,R53,A38,,,,,,\r
0,144,218,Light Blue,S54,C20,C20,R54,A20,,,,,,\r
173,220,145,Pistachio,S55,C12,C12,R57,A12,,,,,,\r
255,106,19,Bright Carrot,S56,C16,,R59,A16,,,,,,\r
164,73,61,Buccaneer,S57,C29,,R63,A29,,,,,,\r
165,0,52,Paprika,S58,C43,,R64,A43,,,,,,\r
74,31,135,Butterfly Bush,S59,C52,C52,,A52,,,,,,\r
167,123,202,Lavender,S60,C25,C25,R66,A25,,,,,,\r
206,220,0,Key Lime Pie,S61,C40,,R68,A40,,,,,,\r
0,124,88,Green Tea,S62,C15,C15,R69,A15,,,,,,\r
88,87,53,Metallic Copper,S63,,,R70,,,,,,,\r
5,8,73,Black Rock,S64,C58,,R55,A58,,,,,,\r
243,234,93,Canary,S65,C46,,R58,A46,,,,,,\r
244,99,58,Blaze Orange,S66,,,R60,,,,,,,\r
243,207,179,Vanilla,S67,C47,C47,R61,A47,,,,,,\r
225,192,120,Tan,S68,,,R71,,,,,,,\r
40,40,40,Mine Shaft,S69,C69,,R72,A69,,,,,,\r
155,188,17,Dark Algae,S70,C84,,R89,A84,,,,,,\r
0,133,34,Jade Green,S71,C86,C86,R73,A86,,,,,,\r
89,213,216,Light Sea Blue,S72,C79,C79,R74,A79,,,,,,\r
72,169,197,Steel Blue,S73,C81,C81,R91,A81,,,,,,\r
0,174,214,Azure,S74,C82,C82,R75,A82,,,,,,\r
0,133,173,Dark Steel Blue,S75,C83,,R92,A83,,,,,,\r
0,174,199,Sea Blue,S76,C80,,R76,A80,,,,,,\r
239,239,239,Ghost While,S77,C87,,R77,A87,,,,,,\r
209,209,209,Ash Grey,S78,C88,C88,R78,A88,,,,,,\r
187,188,188,Light Gray,S79,C89,,R79,A89,,,,,,\r
153,155,48,Dark Olive,S80,C85,,R90,A85,,,,,,\r
205,178,119,Deer,S81,C74,,R81,A74,,,,,,\r
181,129,80,Clay,S82,C75,,R82,A75,,,,,,\r
184,97,37,Sienna,S83,C73,,R83,A73,,,,,,\r
170,87,97,Deep Chestnut,S84,C77,,R84,A77,,,,,,\r
92,19,27,Red Wine,S85,C78,C78,R85,A78,,,,,,\r
234,170,0,Goldenrod,S86,C71,,R86,A71,,,,,,\r
255,109,106,Coral Red,S87,C76,,R87,A76,,,,,,\r
218,24,132,Dark Pink,S88,,,,,,,,,,\r
77,77,77,Charcoal Gray,S89,C90,,R88,A90,,,,,,\r
255,197,110,Pastel Orange,S90,C72,,R80,A72,,,,,,\r
24,48,40,Brunswick Green,S91,C70,C70,R93,A70,,,,,,\r
222,185,71,Dandelion,S92,C91,,,A91,,,,,,\r
218,182,152,Pale Skin,S93,C92,,,A92,,,,,,\r
244,169,153,Warm Blush,S94,C93,,,A93,,,,,,\r
238,125,103,Salmon,S95,C94,,,A94,,,,,,\r
240,134,97,Apricot,S96,C95,,,A95,,,,,,\r
212,114,42,Papaya,S97,C96,,,A96,,,,,,\r
100,172,223,Himalaya Blue,S98,C97,,,A97,,,,,,\r
100,194,220,Waterfall,S99,C98,,,A98,,,,,,\r
93,219,93,Spring Green,,C45,,R56,A45,,,,,,\r
108,194,74,Confier,,C55,,,A55,,,,,,\r
188,4,35,Fresh Red,,C57,C57,R65,A57,,,,,,\r
83,26,35,Scarlett,,C59,,R62,A59,,,,,,\r
241,235,156,Feta,,C61,,,A61,,,,,,\r
252,63,63,Carnation,,C62,,,A62,,,,,,\r
234,190,219,Pink Pearl,,C63,,,A63,,,,,,\r
165,0,80,Rose,,C64,C64,,A64,,,,,,\r
239,129,46,Mango Tango,,C65,,,A65,,,,,,\r
252,108,133,Wild Watermelon,,C66,,,A66,,,,,,\r
177,78,181,Orchid,,C67,,,A67,,,,,,\r
105,194,238,Toothpaste Blue,,C68,C68,,A68,,,,,,\r
255,197,110,Yolk Yellow,,,,R67,,,,,,,\r
255,255,255,White,,,,,,1,1,,1,,\r
190,195,191,Light Gray,,,,,,1,,,1,,\r
150,152,156,Gray,,,,,,1,1,,1,,\r
147,161,159,Pewter,,,,,,1,,,,,\r
84,95,95,Charcoal,,,,,,1,,,,,\r
86,87,92,Dark Gray,,,,,,1,,,,,\r
0,0,0,Black,,,,,,1,1,,1,,\r
241,229,216,Toasted Marshmallow,,,,,,1,,,1,,\r
234,196,159,Sand,,,,,,1,,,1,,\r
215,176,135,Fawn,,,,,,1,,,,,\r
207,168,137,Tan,,,,,,1,1,,1,,\r
160,78,63,Rust,,,,,,1,,,,,\r
136,64,79,Cranapple,,,,,,1,,,,,\r
164,123,71,Light Brown,,,,,,1,1,,1,,\r
126,84,70,Gingerbread,,,,,,1,,,,,\r
108,82,77,Brown,,,,,,1,1,,1,,\r
237,231,186,Creme,,,,,,1,,,,,\r
250,238,141,Pastel Yellow,,,,,,1,,,,,\r
249,215,55,Yellow,,,,,,1,1,,1,,\r
255,182,78,Cheddar,,,,,,1,1,,,,\r
255,128,62,Orange,,,,,,1,,,1,,\r
225,154,82,Butterscotch,,,,,,1,1,,1,,\r
218,140,44,Honey,,,,,,1,,,,,\r
255,97,88,Hot Coral,,,,,,1,1,,,,\r
255,119,127,Salmon,,,,,,1,,,,,\r
255,158,141,Blush,,,,,,1,1,,,,\r
255,181,190,Flamingo,,,,,,1,,,,,\r
252,198,184,Peach,,,,,,1,,,1,,\r
245,192,213,Light Pink,,,,,,1,,,,,\r
225,109,157,Bubblegum,,,,,,1,,,1,,\r
230,87,148,Pink,,,,,,1,,,,,\r
243,70,118,Magenta,,,,,,1,,,,,\r
196,58,68,Red,,,,,,1,1,,1,,\r
173,51,69,Cherry,,,,,,1,,,,,\r
173,60,108,Raspberry,,,,,,1,1,,,,\r
178,95,170,Plum,,,,,,1,1,,,,\r
180,166,211,Lavender,,,,,,1,,,,,\r
149,130,187,Pastel Lavender,,,,,,1,1,,1,,\r
111,84,147,Purple,,,,,,1,1,,1,,\r
135,167,225,Blueberry Cr\xE8me,,,,,,1,,,,,\r
108,136,191,Periwinkle,,,,,,1,,,,,\r
180,217,223,Robin's Egg,,,,,,1,,,,,\r
99,169,214,Pastel Blue,,,,,,1,,,,,\r
39,138,203,Light Blue,,,,,,1,1,,1,,\r
0,102,179,Cobalt,,,,,,1,,,,,\r
43,48,124,Dark Blue,,,,,,1,1,,1,,\r
22,40,70,Midnight,,,,,,1,,,,,\r
176,232,213,Toothpaste,,,,,,1,1,,1,,\r
0,143,204,Turquoise,,,,,,1,1,,1,,\r
56,199,175,Light Green,,,,,,1,,,,,\r
0,150,138,Parrot Green,,,,,,1,1,,,,\r
115,213,148,Pastel Green,,,,,,1,1,,,,\r
119,202,74,Kiwi Lime,,,,,,1,1,,1,,\r
84,177,96,Bright Green,,,,,,1,,,1,,\r
0,150,84,Shamrock,,,,,,1,,,,,\r
16,131,85,Dark Green,,,,,,1,1,,1,,\r
203,215,53,Prickly Pear,,,,,,1,,,,,\r
60,97,79,Evergreen,,,,,,1,,,,,\r
247,209,0,Yellow,,,,,,,,,,1,\r
255,147,0,Orange,,,,,,,,,,1,\r
250,217,138,Cream,,,,,,,,,,1,\r
238,0,4,Red,,,,,,,,,,1,\r
161,171,172,Gray,,,,,,,,,,1,\r
0,63,44,Dark Green,,,,,,,,,,1,\r
2,18,153,Blue,,,,,,,,,,1,\r
116,38,160,Purple,,,,,,,,,,1,\r
0,111,223,Light Blue,,,,,,,,,,1,\r
80,50,22,Brown,,,,,,,,,,1,\r
80,171,110,Light Green,,,,,,,,,,1,\r
243,0,118,Pink,,,,,,,,,,1,\r
0,0,0,Black,,,,,,,,,,1,\r
255,255,255,White,,,,,,,,,,1,\r
0,0,0,Black,,,,,,,,,,,1\r
1,78,218,Blue,,,,,,,,,,,1\r
1,0,78,Dark Blue,,,,,,,,,,,1\r
0,196,249,Light Blue,,,,,,,,,,,1\r
0,40,39,Forest Green,,,,,,,,,,,1\r
1,195,81,Green,,,,,,,,,,,1\r
157,212,0,Light Green,,,,,,,,,,,1\r
248,235,193,Peach,,,,,,,,,,,1\r
239,240,244,White,,,,,,,,,,,1\r
126,101,221,Purple,,,,,,,,,,,1\r
116,0,160,Royal Purple,,,,,,,,,,,1\r
170,91,0,Leather,,,,,,,,,,,1\r
161,102,0,Brown,,,,,,,,,,,1\r
155,158,151,Gray,,,,,,,,,,,1\r
252,218,0,Yellow,,,,,,,,,,,1\r
254,230,0,Light Yellow,,,,,,,,,,,1\r
251,197,62,Light Orange,,,,,,,,,,,1\r
255,176,224,Pink,,,,,,,,,,,1\r
241,0,109,Deep Pink,,,,,,,,,,,1\r
255,151,0,Orange,,,,,,,,,,,1\r
149,0,2,Burgundy,,,,,,,,,,,1\r
240,12,1,Red,,,,,,,,,,,1`});var Yt=W((xa,hn)=>{hn.exports=`FFE2E2.3713.Salmon Very Light\r
FFC9C9.761.Salmon Light\r
F5ADAD.760.Salmon\r
F18787.3712.Salmon Medium\r
E36D6D.3328.Salmon Dark\r
BF2D2D.347.Salmon Very Dark\r
FED7CC.353.Peach\r
FD9C97.352.Coral Light\r
E96A67.351.Coral\r
E04848.350.Coral Medium\r
D21035.349.Coral Dark\r
BB051F.817.Coral Red Very Dark\r
FFCBD5.3708.Melon Light\r
FFADBC.3706.Melon Medium\r
FF7992.3705.Melon Dark\r
E74967.3801.Melon Very Dark\r
E31D42.666.Bright Red\r
C72B3B.321.Red\r
B71F33.304.Red Medium\r
A7132B.498.Red Dark\r
970B23.816.Garnet\r
87071F.815.Garnet Medium\r
7B001B.814.Garnet Dark\r
FFB2BB.894.Carnation Very Light\r
FC90A2.893.Carnation Light\r
FF798C.892.Carnation Medium\r
FF5773.891.Carnation Dark\r
FFDFD9.818.Baby Pink\r
FDB5B5.957.Geranium Pale\r
FF9191.956.Geranium\r
564A4A.309.Rose Dark\r
FFD7D7.963.Dusty Rose Ultra Very Light\r
FFBDBD.3716.Dusty Rose Medium Very Light\r
E68A8A.962.Dusty Rose Medium\r
CF7373.961.Dusty Rose Dark\r
EA8699.3833.Raspberry Light\r
DB556E.3832.Raspberry Medium\r
B32F48.3831.Raspberry Dark\r
913546.777.Raspberry Very Dark\r
FFEEEB.819.Baby Pink Light\r
FBADB4.3326.Rose Light\r
FCB0B9.776.Pink Medium\r
F27688.899.Rose Medium\r
EE546E.335.Rose\r
B33B4B.326.Rose Very Dark\r
F0CED4.151.Dusty Rose Very Light\r
E4A6AC.3354.Dusty Rose Light\r
E8879B.3733.Dusty Rose\r
DA6783.3731.Dusty Rose Very Dark\r
BC4365.3350.Dusty Rose Ultra Dark\r
AB0249.150.Dusty Rose Ultra Very Dark\r
FBBFC2.3689.Mauve Light\r
E7A9AC.3688.Mauve Medium\r
C96B70.3687.Mauve\r
AB3357.3803.Mauve Dark\r
881531.3685.Mauve Very Dark\r
FFC0CD.605.Cranberry Very Light\r
FFB0BE.604.Cranberry Light\r
FFA4BE.603.Cranberry\r
E24874.602.Cranberry Medium\r
D1286A.601.Cranberry Dark\r
CD2F63.600.Cranberry Very Dark\r
FF8CAE.3806.Cyclamen Pink Light\r
F3478B.3805.Cyclamen Pink\r
E02876.3804.Cyclamen Pink Dark\r
F4AED5.3609.Plum Ultra Light\r
EA9CC4.3608.Plum Very Light\r
C54989.3607.Plum Light\r
9C2462.718.Plum\r
9B1359.917.Plum Medium\r
820043.915.Plum Dark\r
FFDFD5.225.Shell Pink Ultra Very Light\r
EBB7AF.224.Shell Pink Very Light\r
E2A099.152.Shell Pink Medium Light\r
CC847C.223.Shell Pink Light\r
BC6C64.3722.Shell Pink Medium\r
A14B51.3721.Shell Pink Dark\r
883E43.221.Shell Pink Very Dark\r
DFB3BB.778.Antique Mauve Very Light\r
DBA9B2.3727.Antique Mauve Light\r
B7737F.316.Antique Mauve Medium\r
9B5B66.3726.Antique Mauve Dark\r
814952.315.Antique Mauve Medium Dark\r
714149.3802.Antique Mauve Very Darkv\r
822637.902.Garnet Very Dark\r
D7CBD3.3743.Antique Violet Very Light\r
B79DA7.3042.Antique Violet Light\r
956F7C.3041.Antique Violet Medium\r
785762.3740.Antique Violet Dark\r
BA91AA.3836.Grape Light\r
946083.3835.Grape Medium\r
72375D.3834.Grape Dark\r
572433.154.Grape Very Dark\r
E3CBE3.211.Lavender Light\r
C39FC3.210.Lavender Medium\r
A37BA7.209.Lavender Dark\r
835B8B.208.Lavender Very Dark\r
6C3A6E.3837.Lavender Ultra Dark\r
633666.327.Violet Dark\r
E6CCD9.153.Violet Very Light\r
DBB3CB.554.Violet Light\r
A3638B.553.Violet\r
803A6B.552.Violet Medium\r
5C184E.550.Violet Very Dark\r
D3D7ED.3747.Blue Violet Very Light\r
B7BFDD.341.Blue Violet Light\r
A3AED1.156.Blue Violet Medium Light\r
ADA7C7.340.Blue Violet Medium\r
9891B6.155.Blue Violet Medium Dark\r
776B98.3746.Blue Violet Dark\r
5C5478.333.Blue Violet Very Dark\r
BBC3D9.157.Cornflower Blue Very Light\r
8F9CC1.794.Cornflower Blue Light\r
707DA2.793.Cornflower Blue Medium\r
60678C.3807.Cornflower Blue\r
555B7B.792.Cornflower Blue Dark\r
4C526E.158.Cornflower Blue Very Dark\r
464563.791.Cornflower Blue Very Dark\r
B0C0DA.3840.Lavender Blue Light\r
7B8EAB.3839.Lavender Blue Medium\r
5C7294.3838.Lavender Blue Dark\r
C0CCDE.800.Delft Blue Pale\r
94A8C6.809.Delft Blue\r
748EB6.799.Delft Blue Medium\r
466A8E.798.Delft Blue Dark\r
13477D.797.Royal Blue\r
11416D.796.Royal Blue Dark\r
0E365C.820.Royal Blue Very Dark\r
DBECF5.162.Blue Ultra Very Light\r
BDDDED.827.Blue Very Light\r
A1C2D7.813.Blue Light\r
6B9EBF.826.Blue Medium\r
4781A5.825.Blue Dark\r
396987.824.Blue Very Dark\r
30C2EC.996.Electric Blue Medium\r
14AAD0.3843.Electric Blue\r
2696B6.995.Electric Blue Dark\r
06E3E6.3846.Turquoise Bright Light\r
04C4CA.3845.Turquoise Bright Medium\r
12AEBA.3844.Turquoise Bright Dark\r
C7CAD7.159.Blue Gray Light\r
999FB7.160.Blue Gray Medium\r
7880A4.161.Blue Gray\r
EEFCFC.3756.Baby Blue Ultra Very Light\r
D9EBF1.775.Baby Blue Very Light\r
CDDFED.3841.Baby Blue Pale\r
B8D2E6.3325.Baby Blue Light\r
93B4CE.3755.Baby Blue\r
739FC1.334.Baby Blue Medium\r
5A8FB8.322.Baby Blue Dark\r
35668B.312.Baby Blue Very Dark\r
2C597C.803.Baby Blue Ultra Very Dark\r
253B73.336.Navy Blue\r
213063.823.Navy Blue Dark\r
1B2853.939.Navy Blue Very Dark\r
DBE2E9.3753.Antique Blue Ultra Very Light\r
C7D1DB.3752.Antique Blue Very Light\r
A2B5C6.932.Antique Blue Light\r
6A859E.931.Antique Blue Medium\r
455C71.930.Antique Blue Dark\r
384C5E.3750.Antique Blue Very Dark\r
C5E8ED.828.Sky Blue Very Light\r
ACD8E2.3761.Sky Blue Light\r
7EB1C8.519.Sky Blue\r
4F93A7.518.Wedgewood Light\r
3E85A2.3760.Wedgewood Medium\r
3B768F.517.Wedgewood Dark\r
32667C.3842.Wedgewood Very Dark\r
1C5066.311.Wedgewood Ultra Very Dark\r
E5FCFD.747.Peacock Blue Very Light\r
99CFD9.3766.Peacock Blue Light\r
64ABBA.807.Peacock Blue\r
3D95A5.806.Peacock Blue Dark\r
347F8C.3765.Peacock Blue Very Dark\r
BCE3E6.3811.Turquoise Very Light\r
90C3CC.598.Turquoise Light\r
5BA3B3.597.Turquoise\r
488E9A.3810.Turquoise Dark\r
3F7C85.3809.Turquoise Vy Dark\r
366970.3808.Turquoise Ultra Very Dark\r
DDE3E3.928.Gray Green Very Light\r
BDCBCB.927.Gray Green Light\r
98AEAE.926.Gray Green Medium\r
657F7F.3768.Gray Green Dark\r
566A6A.924.Gray Green Vy Dark\r
52B3A4.3849.Teal Green Light\r
559392.3848.Teal Green Medium\r
347D75.3847.Teal Green Dark\r
A9E2D8.964.Sea Green Light\r
59C7B4.959.Sea Green Medium\r
3EB6A1.958.Sea Green Dark\r
2F8C84.3812.Sea Green Very Dark\r
49B3A1.3851.Green Bright Light\r
3D9384.943.Green Bright Medium\r
378477.3850.Green Bright Dark\r
90C0B4.993.Aquamarine Very Light\r
6FAE9F.992.Aquamarine Light\r
508B7D.3814.Aquamarine\r
477B6E.991.Aquamarine Dark\r
B9D7C0.966.Jade Ultra Very Light\r
A7CDAF.564.Jade Very Light\r
8FC098.563.Jade Light\r
53976A.562.Jade Medium\r
338362.505.Jade Green\r
99C3AA.3817.Celadon Green Light\r
65A57D.3816.Celadon Green\r
4D8361.163.Celadon Green Medium\r
477759.3815.Celadon Green Dark\r
2C6A45.561.Celadon Green VD\r
C4DECC.504.Blue Green Very Light\r
B2D4BD.3813.Blue Green Light\r
7BAC94.503.Blue Green Medium\r
5B9071.502.Blue Green\r
396F52.501.Blue Green Dark\r
044D33.500.Blue Green Very Dark\r
A2D6AD.955.Nile Green Light\r
88BA91.954.Nile Green\r
6DAB77.913.Nile Green Medium\r
1B9D6B.912.Emerald Green Light\r
189065.911.Emerald Green Medium\r
187E56.910.Emerald Green Dark\r
156F49.909.Emerald Green Very Dark\r
115A3B.3818.Emerald Green Ultra Very Dark\r
D7EDCC.369.Pistachio Green Very Light\r
A6C298.368.Pistachio Green Light\r
69885A.320.Pistachio Green Medium\r
617A52.367.Pistachio Green Dark\r
205F2E.319.Pistachio Grn Very Dark\r
174923.890.Pistachio Grn Ultra Very Dark\r
C8D8B8.164.Forest Green Light\r
8DA675.989.Forest Green\r
738B5B.988.Forest Green Medium\r
587141.987.Forest Green Dark\r
405230.986.Forest Green Very Dark\r
E4ECD4.772.Yellow Green Very Light\r
CCD9B1.3348.Yellow Green Light\r
71935C.3347.Yellow Green Medium\r
406A3A.3346.Hunter Green\r
1B5915.3345.Hunter Green Dark\r
1B5300.895.Hunter Green Very Dark\r
9ECF34.704.Chartreuse Bright\r
7BB547.703.Chartreuse\r
47A72F.702.Kelly Green\r
3F8F29.701.Green Light\r
07731B.700.Green Bright\r
056517.699.Green\r
C7E666.907.Parrot Green Light\r
7FB335.906.Parrot Green Medium\r
628A28.905.Parrot Green Dark\r
557822.904.Parrot Green Very Dark\r
D8E498.472.Avocado Green Ultra Light\r
AEBF79.471.Avocado Grn Very Light\r
94AB4F.470.Avocado Grn Light\r
72843C.469.Avocado Green\r
627133.937.Avocado Green Medium\r
4C5826.936.Avocado Green Very Dark\r
424D21.935.Avocado Green Dark\r
313919.934.Avocado Grn Black\r
ABB197.523.Fern Green Light\r
9CA482.3053.Green Gray\r
889268.3052.Green Gray Medium\r
5F6648.3051.Green Gray Dark\r
C4CDAC.524.Fern Green Very Light\r
969E7E.522.Fern Green\r
666D4F.520.Fern Green Dark\r
83975F.3364.Pine Green\r
728256.3363.Pine Green Medium\r
5E6B47.3362.Pine Green Dark\r
EFF4A4.165.Moss Green Very Light\r
E0E868.3819.Moss Green Light\r
C0C840.166.Moss Green Medium Light\r
A7AE38.581.Moss Green\r
888D33.580.Moss Green Dark\r
C7C077.734.Olive Green Light\r
BCB34C.733.Olive Green Medium\r
948C36.732.Olive Green\r
938B37.731.Olive Green Dark\r
827B30.730.Olive Green Very Dark\r
B9B982.3013.Khaki Green Light\r
A6A75D.3012.Khaki Green Medium\r
898A58.3011.Khaki Green Dark\r
CCB784.372.Mustard Light\r
BFA671.371.Mustard\r
B89D64.370.Mustard Medium\r
DBBE7F.834.Golden Olive Very Light\r
C8AB6C.833.Golden Olive Light\r
BD9B51.832.Golden Olive\r
AA8F56.831.Golden Olive Medium\r
8D784B.830.Golden Olive Dark\r
7E6B42.829.Golden Olive Very Dark\r
DCC4AA.613.Drab Brown Very Light\r
BC9A78.612.Drab Brown Light\r
967656.611.Drab Brown\r
796047.610.Drab Brown Dark\r
E7D6C1.3047.Yellow Beige Light\r
D8BC9A.3046.Yellow Beige Medium\r
BC966A.3045.Yellow Beige Dark\r
A77C49.167.Yellow Beige Very Dark\r
FCFCEE.746.Off White\r
F5ECCB.677.Old Gold Very Light\r
C69F7B.422.Hazelnut Brown Light\r
B78B61.3828.Hazelnut Brown\r
A07042.420.Hazelnut Brown Dark\r
835E39.869.Hazelnut Brown Very Dark\r
E4B468.728.Topaz\r
CE9124.783.Topaz Medium\r
AE7720.782.Topaz Dark\r
A26D20.781.Topaz Very Dark\r
94631A.780.Topaz Ultra Very Dark\r
E5CE97.676.Old Gold Light\r
D0A53E.729.Old Gold Medium\r
BC8D0E.680.Old Gold Dark\r
A98204.3829.Old Gold Vy Dark\r
F6DC98.3822.Straw Light\r
F3CE75.3821.Straw\r
DFB65F.3820.Straw Dark\r
CD9D37.3852.Straw Very Dark\r
FFFB8B.445.Lemon Light\r
FDED54.307.Lemon\r
FFE300.973.Canary Bright\r
FFD600.444.Lemon Dark\r
FDF9CD.3078.Golden Yellow Very Light\r
FFF1AF.727.Topaz Very Light\r
FDD755.726.Topaz Light\r
FFC840.725.Topaz Medium Light\r
FFB515.972.Canary Deep\r
FFE9AD.745.Yellow Pale Light\r
FFE793.744.Yellow Pale\r
FED376.743.Yellow Medium\r
FFBF57.742.Tangerine Light\r
FFA32B.741.Tangerine Medium\r
FF8B00.740.Tangerine\r
F78B13.970.Pumpkin Light\r
F67F00.971.Pumpkin\r
FF7B4D.947.Burnt Orange\r
EB6307.946.Burnt Orange Medium\r
D15807.900.Burnt Orange Dark\r
FFDED5.967.Apricot Very Light\r
FECDC2.3824.Apricot Light\r
FCAB98.3341.Apricot\r
FF836F.3340.Apricot Medium\r
FD5D35.608.Burnt Orange Bright\r
FA3203.606.Orange Red Bright\r
FFE2CF.951.Tawny Light\r
FFD3B5.3856.Mahogany Ultra Very Light\r
F7976F.722.Orange Spice Light\r
F27842.721.Orange Spice Medium\r
E55C1F.720.Orange Spice Dark\r
FDBD96.3825.Pumpkin Pale\r
E27323.922.Copper Light\r
C66218.921.Copper\r
AC5414.920.Copper Medium\r
A64510.919.Red Copper\r
82340A.918.Red Copper Dark\r
FFEEE3.3770.Tawny Vy Light\r
FBD5BB.945.Tawny\r
F7A777.402.Mahogany Very Light\r
CF7939.3776.Mahogany Light\r
B35F2B.301.Mahogany Medium\r
8F430F.400.Mahogany Dark\r
6F2F00.300.Mahogany Very Dark\r
FFFDE3.3823.Yellow Ultra Pale\r
FAD396.3855.Autumn Gold Light\r
F2AF68.3854.Autumn Gold Medium\r
F29746.3853.Autumn Gold Dark\r
F7BB77.3827.Golden Brown Pale\r
DC9C56.977.Golden Brown Light\r
C28142.976.Golden Brown Medium\r
AD7239.3826.Golden Brown\r
914F12.975.Golden Brown Dark\r
FEE7DA.948.Peach Very Light\r
F7CBBF.754.Peach Light\r
F4BBA9.3771.Terra Cotta Ultra Very Light\r
EEAA9B.758.Terra Cotta Very Light\r
D98978.3778.Terra Cotta Light\r
C56A5B.356.Terra Cotta Medium\r
B95544.3830.Terra Cotta\r
984436.355.Terra Cotta Dark\r
863022.3777.Terra Cotta Very Dark\r
F8CAC8.3779.Rosewood Ultra Very Light\r
BA8B7C.3859.Rosewood Light\r
964A3F.3858.Rosewood Medium\r
68251A.3857.Rosewood Dark\r
F3E1D7.3774.Desert Sand Very Light\r
EED3C4.950.Desert Sand Light\r
C48E70.3064.Desert Sand\r
BB8161.407.Desert Sand Medium\r
B67552.3773.Desert Sand Dark\r
A06C50.3772.Desert Sand Very Dark\r
875539.632.Desert Sand Ultra Very Dark\r
D7CECB.453.Shell Gray Light\r
C0B3AE.452.Shell Gray Medium\r
917B73.451.Shell Gray Dark\r
A68881.3861.Cocoa Light\r
7D5D57.3860.Cocoa\r
624B45.779.Cocoa Dark\r
FFFBEF.712.Cream\r
F8E4C8.739.Tan Ultra Very Light\r
ECCC9E.738.Tan Very Light\r
E4BB8E.437.Tan Light\r
CB9051.436.Tan\r
B87748.435.Brown Very Light\r
985E33.434.Brown Light\r
7A451F.433.Brown Medium\r
653919.801.Coffee Brown Dark\r
492A13.898.Coffee Brown Very Dark\r
361F0E.938.Coffee Brown Ultra Dark\r
1E1108.3371.Black Brown\r
F2E3CE.543.Beige Brown Ultra Very Light\r
CBB69C.3864.Mocha Beige Light\r
A4835C.3863.Mocha Beige Medium\r
8A6E4E.3862.Mocha Beige Dark\r
4B3C2A.3031.Mocha Brown Very Dark\r
FFFFFF.B5200.Snow White\r
FCFBF8.Blanc.White\r
F9F7F1.3865.Winter White\r
F0EADA.Ecru.Ecru\r
E7E2D3.822.Beige Gray Light\r
DDD8CB.644.Beige Gray Medium\r
A49878.642.Beige Gray Dark\r
857B61.640.Beige Gray Very Dark\r
625D50.3787.Brown Gray Dark\r
4F4B41.3021.Brown Gray Very Dark\r
EBEAE7.3024.Brown Gray Very Light\r
B1AA97.3023.Brown Gray Light\r
8E9078.3022.Brown Gray Medium\r
636458.535.Ash Gray Very Light\r
E3D8CC.3033.Mocha Brown Very Light\r
D2BCA6.3782.Mocha Brown Light\r
B39F8B.3032.Mocha Brown Medium\r
7F6A55.3790.Beige Gray Ultra Dark\r
6B5743.3781.Mocha Brown Dark\r
FAF6F0.3866.Mocha Brown Ultra Very Light\r
D1BAA1.842.Beige Brown Very Light\r
B69B7E.841.Beige Brown Light\r
9A7C5C.840.Beige Brown Medium\r
675541.839.Beige Brown Dark\r
594937.838.Beige Brown Very Dark\r
E6E8E8.3072.Beaver Gray Very Light\r
BCB4AC.648.Beaver Gray Light\r
B0A69C.647.Beaver Gray Medium\r
877D73.646.Beaver Gray Dark\r
6E655C.645.Beaver Gray Very Dark\r
484848.844.Beaver Gray Ultra Dark\r
ECECEC.762.Pearl Gray Very Light\r
D3D3D6.415.Pearl Gray\r
ABABAB.318.Steel Gray Light\r
8C8C8C.414.Steel Gray Dark\r
D1D1D1.168.Pewter Very Light\r
848484.169.Pewter Light\r
6C6C6C.317.Pewter Gray\r
565656.413.Pewter Gray Dark\r
424242.3799.Pewter Gray Very Dark\r
000000.310.Black\r
E3E3E6.1.White Tin\r
D7D7D8.2.Tin\r
B8B8BB.3.Tin Medium\r
AEAEB1.4.Tin Dark\r
E3CCBE.5.Driftwood Light\r
DCC6B8.6.Driftwood Medium Light\r
8F7B6E.7.Driftwood\r
6A5046.8.Driftwood Dark\r
55200E.9.Cocoa Very Dark\r
EDFED9.10.Tender Green Very Light\r
E2EDB5.11.Tender Green Light\r
CDD99A.12.Tender Green\r
BFF6E0.13.Nile Green Medium Light\r
D0FBB2.14.Apple Green Pale\r
D1EDA4.15.Apple Green\r
C9C258.16.Chartreuse Light\r
E5E272.17.Yellow Plum Light\r
D9D56D.18.Yellow Plum\r
F7C95F.19.Autumn Gold medium Light\r
F7AF93.20.Shrimp\r
D79982.21.Alizarin Light\r
BC604E.22.Alizarin\r
EDE2ED.23.Apple Blossom\r
E0D7EE.24.White Lavender\r
DAD2E9.25.Lavender Ultra Light\r
D7CAE6.26.Lavender Pale\r
F0EEF9.27.White Violet\r
9086A9.28.Eggplant Medium Light\r
674076.29.Eggplant\r
7D77A5.30.Blueberry Medium Light\r
50518D.31.Blueberry\r
4D2E8A.32.Blueberry Dark\r
9C599E.33.Fuschia\r
7D3064.34.Fuschia Dark\r
46052D.35.Fuschia Very Dark`});var qt=W((Pa,gn)=>{gn.exports=`FFFFFF.1.White\r
DDDEDD.2.Grey\r
D9BB7B.5.Brick Yellow\r
D67240.18.Nougat\r
FF0000.21.Bright Red\r
0000FF.23.Bright Blue\r
FFFF00.24.Bright Yellow\r
000000.26.Black\r
009900.28.Dark Green\r
00CC00.37.Bright Green\r
A83D15.38.Dark Orange\r
478CC6.102.Medium Blue\r
FF6600.106.Bright Orange\r
059D9E.107.Bright Bluish Green\r
95B90B.119.Bright Yellowish-Green\r
990066.124.Bright Reddish Violet\r
5E748C.135.Sand Blue\r
8D7452.138.Sand Yellow\r
002541.140.Earth Blue\r
003300.141.Earth Green\r
5F8265.151.Sand Green\r
80081B.154.Dark Red\r
F49B00.191.Flame Yellowish Orange\r
5B1C0C.192.Reddish Brown\r
9C9291.194.Medium Stone Grey\r
4C5156.199.Dark Stone Grey\r
E4E4DA.208.Light Stone Grey\r
87C0EA.212.Light Royal Blue\r
DE378B.221.Bright Purple\r
EE9DC3.222.Light Purple\r
FFFF99.226.Cool Yellow\r
2C1577.268.Dark Purple\r
F5C189.283.Light Nougat\r
300F06.308.Dark Brown\r
AA7D55.312.Medium Nougat\r
469BC3.321.Dark Azure\r
68C3E2.322.Medium Azure\r
D3F2EA.323.Aqua\r
A06EB9.324.Medium Lavender\r
CDA4DE.325.Lavender\r
F5F3D7.329.White Glow\r
E2F99A.326.Spring Yellowish Green\r
77774E.330.Olive Green\r
96B93B.331.Medium-Yellowish Green`});var Je=W(tr=>{tr.ciede2000=Cn;var N=Math.sqrt,M=Math.pow,ke=Math.cos,_n=Math.atan2,Zt=Math.sin,Ae=Math.abs,bn=Math.exp,er=Math.PI;function Cn(e,t){var r=e.L,n=e.a,a=e.b,o=t.L,i=t.a,d=t.b,p=1,c=1,s=1,u=N(M(n,2)+M(a,2)),f=N(M(i,2)+M(d,2)),g=(u+f)/2,m=.5*(1-N(M(g,7)/(M(g,7)+M(25,7)))),C=(1+m)*n,v=(1+m)*i,b=N(M(C,2)+M(a,2)),h=N(M(v,2)+M(d,2)),_=Qt(a,C),k=Qt(d,v),y=o-r,D=h-b,w=wn(u,f,_,k),B=2*N(b*h)*Zt(ee(w)/2),x=(r+o)/2,A=(b+h)/2,S=Dn(u,f,_,k),F=1-.17*ke(ee(S-30))+.24*ke(ee(2*S))+.32*ke(ee(3*S+6))-.2*ke(ee(4*S-63)),I=30*bn(-M((S-275)/25,2)),$=N(M(A,7)/(M(A,7)+M(25,7))),oe=1+.015*M(x-50,2)/N(20+M(x-50,2)),Z=1+.045*A,ht=1+.015*A*F,Nr=-2*$*Zt(ee(2*I)),Wr=N(M(y/(oe*p),2)+M(D/(Z*c),2)+M(B/(ht*s),2)+Nr*(D/(Z*c))*(B/(ht*s)));return Wr}function vn(e){return e*(180/er)}function ee(e){return e*(er/180)}function Qt(e,t){if(e===0&&t===0)return 0;var r=vn(_n(e,t));return r>=0?r:r+360}function wn(e,t,r,n){if(e*t===0)return 0;if(Ae(n-r)<=180)return n-r;if(n-r>180)return n-r-360;if(n-r<-180)return n-r+360;throw new Error}function Dn(e,t,r,n){if(e*t===0)return r+n;if(Ae(r-n)<=180)return(r+n)/2;if(Ae(r-n)>180&&r+n<360)return(r+n+360)/2;if(Ae(r-n)>180&&r+n>=360)return(r+n-360)/2;throw new Error}});var Ze=W(Se=>{Se.rgb_to_lab=rr;Se.rgba_to_lab=kn;Se.normalize_rgb=Be;var te=Math.pow;function kn(e,r){e=Be(e);var r=typeof r<"u"?Be(r):{R:255,G:255,B:255},n={R:r.R+(e.R-r.R)*e.A,G:r.G+(e.G-r.G)*e.A,B:r.B+(e.B-r.B)*e.A};return rr(n)}function rr(e){return Bn(An(e))}function An(e){e=Be(e);var t=e.R/255,r=e.G/255,n=e.B/255;t>.04045?t=te((t+.055)/1.055,2.4):t=t/12.92,r>.04045?r=te((r+.055)/1.055,2.4):r=r/12.92,n>.04045?n=te((n+.055)/1.055,2.4):n=n/12.92,t*=100,r*=100,n*=100;var a=t*.4124+r*.3576+n*.1805,o=t*.2126+r*.7152+n*.0722,i=t*.0193+r*.1192+n*.9505;return{X:a,Y:o,Z:i}}function Bn(e){var t=100,r=108.883,n=95.047,a=e.Y/t,o=e.Z/r,i=e.X/n;i>.008856?i=te(i,1/3):i=7.787*i+16/116,a>.008856?a=te(a,1/3):a=7.787*a+16/116,o>.008856?o=te(o,1/3):o=7.787*o+16/116;var d=116*a-16,p=500*(i-a),c=200*(a-o);return{L:d,a:p,b:c}}function Be(e){var t={R:e.R||e.r||0,G:e.G||e.g||0,B:e.B||e.b||0};return(typeof e.a<"u"||typeof e.A<"u")&&(t.A=e.A||e.a||0),t}});var ir=W(re=>{re.map_palette=Sn;re.map_palette_lab=xn;re.match_palette_lab=or;re.palette_map_key=nr;re.lab_palette_map_key=ar;var Qe=Je().ciede2000,xe=Ze();function nr(e){e=xe.normalize_rgb(e);var t="R"+e.R+"B"+e.B+"G"+e.G;return"A"in e&&(t=t+"A"+e.A),t}function ar(e){return"L"+e.L+"a"+e.a+"b"+e.b}function Sn(e,t,r,n){var a={};n=typeof n<"u"?n:{R:255,G:255,B:255},r=r||"closest";for(var o=0;o<e.length;o+=1){for(var i=e[o],d=void 0,p=void 0,c=0;c<t.length;c+=1){var s=t[c],u=Pn(i,s,n);if(d==null||r==="closest"&&u<p){d=s,p=u;continue}if(r==="furthest"&&u>p){d=s,p=u;continue}}a[nr(i)]=d}return a}function or(e,t,r){for(var n,a,o=t[0],i=Qe(e,o),d=1,p=t.length;d<p;d+=1)n=t[d],a=Qe(e,n),(!r&&a<i||r&&a>i)&&(o=n,i=a);return o}function xn(e,t,r){for(var n={},a=r==="furthest",o=0;o<e.length;o+=1){var i=e[o];n[ar(i)]=or(i,t,a)}return n}function Pn(e,t,r){var n=xe.rgb_to_lab,a=xe.rgb_to_lab,o=function(i){return xe.rgba_to_lab(i,r)};return"A"in e&&(n=o),"A"in t&&(a=o),e=n(e),t=a(t),Qe(e,t)}});var et=W((Ta,sr)=>{"use strict";var Ln=Je(),lr=Ze(),ge=ir(),G=sr.exports={};G.diff=Ln.ciede2000;G.rgb_to_lab=lr.rgb_to_lab;G.rgba_to_lab=lr.rgba_to_lab;G.map_palette=ge.map_palette;G.palette_map_key=ge.palette_map_key;G.map_palette_lab=ge.map_palette_lab;G.lab_palette_map_key=ge.lab_palette_map_key;G.match_palette_lab=ge.match_palette_lab;G.closest=function(e,t,r){var n=G.palette_map_key(e);r=typeof r<"u"?r:{R:255,G:255,B:255};var a=G.map_palette([e],t,"closest",r);return a[n]};G.furthest=function(e,t,r){var n=G.palette_map_key(e);r=typeof r<"u"?r:{R:255,G:255,B:255};var a=G.map_palette([e],t,"furthest",r);return a[n]};G.closest_lab=function(e,t){return G.match_palette_lab(e,t,!1)};G.furthest_lab=function(e,t){return G.match_palette_lab(e,t,!0)}});var Vr=W((Bo,ia)=>{ia.exports=`line.gridmajor {\r
    stroke-width: 2px;\r
    stroke: rgba(0, 0, 0, 0.5);\r
    filter: drop-shadow(0px 0px 3px rgba(255, 255, 255, .3));\r
    pointer-events: none;\r
}\r
\r
line.gridminor {\r
    stroke-width: 1px;\r
    stroke: rgba(0, 0, 0, 0.2);\r
    pointer-events: none;\r
}\r
\r
text {\r
    font-family: 'Courier New', Courier, monospace;\r
    font-weight: bold;\r
    font-size: 31px;\r
    fill: black;\r
    pointer-events: none;\r
}\r
\r
use.dark text,\r
text.dark {\r
    fill: white;\r
}\r
\r
use.light text,\r
text.light {\r
    fill: black;\r
}\r
`});j();j();var X,L,We,Mt,we=0,$t=[],E=P,Gt=E.__b,Rt=E.__r,It=E.diffed,Tt=E.__c,Vt=E.unmount,Ot=E.__;function he(e,t){E.__h&&E.__h(L,e,we||t),we=0;var r=L.__H||(L.__H={__:[],__h:[]});return e>=r.__.length&&r.__.push({}),r.__[e]}function Ht(e){return we=1,on(Nt,e)}function on(e,t,r){var n=he(X++,2);if(n.t=e,!n.__c&&(n.__=[r?r(t):Nt(void 0,t),function(d){var p=n.__N?n.__N[0]:n.__[0],c=n.t(p,d);p!==c&&(n.__N=[c,n.__[1]],n.__c.setState({}))}],n.__c=L,!L.__f)){var a=function(d,p,c){if(!n.__c.__H)return!0;var s=n.__c.__H.__.filter(function(f){return!!f.__c});if(s.every(function(f){return!f.__N}))return!o||o.call(this,d,p,c);var u=n.__c.props!==d;return s.forEach(function(f){if(f.__N){var g=f.__[0];f.__=f.__N,f.__N=void 0,g!==f.__[0]&&(u=!0)}}),o&&o.call(this,d,p,c)||u};L.__f=!0;var o=L.shouldComponentUpdate,i=L.componentWillUpdate;L.componentWillUpdate=function(d,p,c){if(this.__e){var s=o;o=void 0,a(d,p,c),o=s}i&&i.call(this,d,p,c)},L.shouldComponentUpdate=a}return n.__N||n.__}function K(e,t){var r=he(X++,3);!E.__s&&Ke(r.__H,t)&&(r.__=e,r.u=t,L.__H.__h.push(r))}function Ut(e,t){var r=he(X++,4);!E.__s&&Ke(r.__H,t)&&(r.__=e,r.u=t,L.__h.push(r))}function H(e){return we=5,ln(function(){return{current:e}},[])}function ln(e,t){var r=he(X++,7);return Ke(r.__H,t)&&(r.__=e(),r.__H=t,r.__h=e),r.__}function U(e){var t=L.context[e.__c],r=he(X++,9);return r.c=e,t?(r.__==null&&(r.__=!0,t.sub(L)),t.props.value):e.__}function sn(){for(var e;e=$t.shift();)if(e.__P&&e.__H)try{e.__H.__h.forEach(ve),e.__H.__h.forEach(je),e.__H.__h=[]}catch(t){e.__H.__h=[],E.__e(t,e.__v)}}E.__b=function(e){L=null,Gt&&Gt(e)},E.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),Ot&&Ot(e,t)},E.__r=function(e){Rt&&Rt(e),X=0;var t=(L=e.__c).__H;t&&(We===L?(t.__h=[],L.__h=[],t.__.forEach(function(r){r.__N&&(r.__=r.__N),r.u=r.__N=void 0})):(t.__h.forEach(ve),t.__h.forEach(je),t.__h=[],X=0)),We=L},E.diffed=function(e){It&&It(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&($t.push(t)!==1&&Mt===E.requestAnimationFrame||((Mt=E.requestAnimationFrame)||cn)(sn)),t.__H.__.forEach(function(r){r.u&&(r.__H=r.u),r.u=void 0})),We=L=null},E.__c=function(e,t){t.some(function(r){try{r.__h.forEach(ve),r.__h=r.__h.filter(function(n){return!n.__||je(n)})}catch(n){t.some(function(a){a.__h&&(a.__h=[])}),t=[],E.__e(n,r.__v)}}),Tt&&Tt(e,t)},E.unmount=function(e){Vt&&Vt(e);var t,r=e.__c;r&&r.__H&&(r.__H.__.forEach(function(n){try{ve(n)}catch(a){t=a}}),r.__H=void 0,t&&E.__e(t,r.__v))};var zt=typeof requestAnimationFrame=="function";function cn(e){var t,r=function(){clearTimeout(n),zt&&cancelAnimationFrame(t),setTimeout(e)},n=setTimeout(r,35);zt&&(t=requestAnimationFrame(r))}function ve(e){var t=L,r=e.__c;typeof r=="function"&&(e.__c=void 0,r()),L=t}function je(e){var t=L;e.__c=e.__(),L=t}function Ke(e,t){return!e||e.length!==t.length||t.some(function(r,n){return r!==e[n]})}function Nt(e,t){return typeof t=="function"?t(e):t}j();j();var un=0;function l(e,t,r,n,a,o){t||(t={});var i,d,p=t;if("ref"in p)for(d in p={},t)d=="ref"?i=t[d]:p[d]=t[d];var c={type:e,props:p,key:r,ref:i,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--un,__i:-1,__u:0,__source:a,__self:o};if(typeof e=="function"&&(i=e.defaultProps))for(d in i)p[d]===void 0&&(p[d]=i[d]);return P.vnode&&P.vnode(c),c}var Da=(j(),gt(Ce));function Wt(e){let r=e.gallery.map(([n,a],o)=>l(dn,{alt:`${n}`,src:`${a}`,onClick:()=>e.load(n,a),onDeleteClick:()=>e.requestDelete(a)},n+"."+a));return l("div",{className:"gallery-list",children:r})}function dn(e){return l("div",{className:"gallery-entry",title:e.alt,onClick:e.onClick,children:[l("img",{src:e.src}),l("div",{className:"gallery-delete",onClick:t=>{t.preventDefault(),t.stopPropagation(),e.onDeleteClick()},children:"\u274C"})]})}function jt(e){let t=e.split(/\r?\n/g),r={headers:t[0].split(/,/g),rows:t.slice(1).map(n=>n.split(/,/g))};for(let n of r.rows)if(n.length!==r.headers.length)throw new Error(`Malformed line: ${JSON.stringify(n)} length doesn't match header size (${r.headers.length})`);return r}function Xt(e,t){let r={name:e,colors:[]},n=/^(\S\S)(\S\S)(\S\S)\.([^.]+)\.(.*)$/gm,a;for(;a=n.exec(t);)r.colors.push({r:parseInt(a[1],16),g:parseInt(a[2],16),b:parseInt(a[3],16),code:a[4],name:a[5]});if(r.colors.length)return r;let o=/^(\S\S)(\S\S)(\S\S)(.*)$/gm;for(;a=o.exec(t);)r.colors.push({r:parseInt(a[1],16),g:parseInt(a[2],16),b:parseInt(a[3],16),name:a[4]});return r}function Jt(){let e=jt(Kt());console.assert(e.headers[0]==="R","R"),console.assert(e.headers[1]==="G","G"),console.assert(e.headers[2]==="B","B"),console.assert(e.headers[3]==="Name","Name");let t=[];for(let r=4;r<e.headers.length;r++)t.push({name:e.headers[r],colors:[]});for(let r of e.rows)for(let n=4;n<r.length;n++){let a=r[n];if(a.length){let o={r:parseInt(r[0]),g:parseInt(r[1]),b:parseInt(r[2]),name:r[3]};a!=="1"&&(o.code=r[n]),t[n-4].colors.push(o)}}return t.push(Xt("dmc",Yt())),t.push(Xt("lego",qt())),{sets:t}}var De=.1593017578125;function fn(e,t,r){return[Ye(e),Ye(t),Ye(r)]}function Ye(e){let t=.8359375+18.8515625*Math.pow(e/1e4,De),r=1+2392/128*Math.pow(e/1e4,De);return Math.pow((3424/4096+2413/128*Math.pow(e/1e4,De))/(1+2392/128*Math.pow(e/1e4,De)),2523/32)}function mn(e,t,r){e=qe(e/255),t=qe(t/255),r=qe(r/255);let n=.4124*e+.3576*t+.1805*r,a=.2126*e+.7152*t+.0722*r,o=.0193*e+.1192*t+.9505*r;return[n,a,o]}function yn(e){return e.map(t=>Math.max(t*203,0))}function qe(e){return e<=.04045?e/12.92:Math.pow((e+.055)/1.055,2.4)}function Xe(e){let t=mn(e.r,e.g,e.b),r=yn(t),[n,a,o]=r,i=.3592*n+.6976*a-.0358*o,d=-.1922*n+1.1004*a+.0755*o,p=.007*n+.0749*a+.8434*o,[c,s,u]=fn(i,d,p),f=.5*c+.5*s,g=(6610*c-13613*s+7003*u)/4096,m=(17933*c-17390*s-543*u)/4096;return[f,g,m]}var Va=(j(),gt(Ce)),Oa=et(),ur="ABCDEFGHJKLMNPQRSTVXZ\u03B1\u03B2\u0394\u03B8\u03BB\u03C0\u03A6\u03A8\u03A9abcdefghijklmnopqrstuvwxyz0123456789";var dr={perler:{size:[29,29],pitch:139.75/28},"artkal-mini":{size:[50,50],pitch:137.8/49},"perler-mini":{size:[56,56],pitch:147.9/55},"16 ct":{size:[16,16],pitch:25.4/16},"30 ct":{size:[30,30],pitch:25.4/30},lego:{size:[32,32],pitch:8},funzbo:{size:[29,29],pitch:139.1/28},evoretro:{size:[29,29],pitch:139.3/28}};function fe(e){return dr[e].pitch}function Pe(e){return dr[e].size}function pr(e){return"rgb("+e.r+","+e.g+","+e.b+")"}function J(e){return"#"+tt(e.r)+tt(e.g)+tt(e.b)}function tt(e){return e===void 0?"":e===0?"00":e<16?"0"+e.toString(16):e.toString(16)}function rt(e){return e.r+e.g*1.4+e.b>460}function O(){let e=Date.now();return{mark:t};function t(r){if(window.location.hostname==="localhost"||window.location.search==="?dev"){let n=Date.now();console.log(`PERF: '${r}' finished in ${n-e}ms`),e=n}}}function hr(e,t){let r=[];for(let d=0;d<e.height;d++){r[d]=[];let p=0;for(let c=e.width-1;c>=-t;c--){let s=e.pixels[d][c];c<0||s===void 0||s===-1?p>0&&p--:p=t,r[d][c+t]=p!==0}}let n=[];for(let d=0;d<e.width+t;d++){n[d]=[];let p=0;for(let c=e.height-1;c>=-t;c--)c>=0&&r[c][d]?p=t:p>0&&p--,n[d][c+t]=p>0}let a=0,o=0,i=1/0;for(let d=0;d<t;d++)for(let p=0;p<t;p++){let c=0;for(let s=d;s<e.height+t;s+=t)for(let u=p;u<e.width+t;u+=t)n[u][s]&&c++;c<i&&(a=p,o=d,i=c)}return{xOffset:a,yOffset:o}}function nt(e,t,r,n){let a=[],o=cr(e,r),i=cr(t,n),d=0,p=0;for(let c of i){let s=0,u=0;p++;for(let f of o)u++,a.push({x:s,y:d,row:p,col:u,width:f,height:c}),s+=f;d+=c}return a}function cr(e,t){if(e<=t)return[e];if(e<=t*2)return[Math.ceil(e/2),Math.floor(e/2)];let n=[e%t],a=e-n[0];for(;a>t;)n.push(t),a-=t;return n.push(a),n}function gr(e,t){throw new Error(`Invalid ${e} - ${t}`)}function me(e){return e.code===void 0?e.name:`${e.code} (${e.name})`}function fr(e){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(e)}function at(e){let t=e/25.4;return t<12?`${t.toFixed(1)}\u2033`:`${Math.floor(t/12)}\u2032\u2009${Math.round(t%12)}\u2033`}function mr(e){let t=Math.ceil(e/60);return t<1?"1 minute":t<60?`${t} minutes`:t<120?`${Math.floor(t/60)}:${Math.floor(t%60)}`:`${Math.ceil(t/60)} hours`}var _r=et();function br(e,t){let r=[],n=new Map;for(let a of t)n.set(a.color,a.target);for(let a=0;a<e.height;a++){let o=[];for(let i=0;i<e.width;i++)e.pixels[a][i]===-1?o.push(void 0):o.push(n.get(e.pixels[a][i]));r.push(o)}return{pixels:r,width:e.width,height:e.height}}function Cr(e){let t=O(),r=[],n=new Map;for(let a=0;a<e.height;a++)for(let o=0;o<e.width;o++){let i=e.pixels[a][o];if(i!==-1)if(n.has(i))n.get(i).count++;else{let d={color:i,count:1,r:i&255,g:i>>8&255,b:i>>16&255};r.push(d),n.set(i,d)}}return t.mark(`Palette: Survey colors (${r.length}) and counts`),r}function vr(e,t,r){let n=O(),a=r.nodupes&&(!t||e.length<t.length),o=[];e.sort((d,p)=>p.count-d.count);let i=ot[r.colorMatch];for(let d of e)if(t===void 0){let{r:p,g:c,b:s}=d;o.push({color:d.color,target:{r:p,g:c,b:s,name:J({r:p,g:c,b:s}),code:""},count:d.count})}else{let p=d;if(r.matchBlackAndWhite&&d.r===d.g&&d.g===d.b){let u;d.r>208?u=255-(255-d.r)*.5:d.r<41?u=d.r*.3:u=d.r,p={...d,r:u,b:u,g:u}}let c,s=1/0;for(let u of t){if(a&&o.some(g=>g.target===u))continue;let f=i(p,u);f<s&&(c=u,s=f)}if(c===void 0)throw new Error("impossible");o.push({color:d.color,target:c,count:d.count})}return n.mark("Palette: Assign color entries"),o}var ot={rgb:(e,t)=>Math.pow(e.r-t.r,2)*3+Math.pow(e.g-t.g,2)*4+Math.pow(e.b-t.b,2)*2,rgb2:(e,t,r,n)=>Math.pow(e-n.r,2)*3+Math.pow(t-n.g,2)*4+Math.pow(r-n.b,2)*2,ciede2000:(e,t)=>_r.diff(yr(e),yr(t)),ictcp:(e,t)=>{let r=Xe(e),n=Xe(t),a=r[0]-n[0],o=(r[1]-n[1])/2,i=r[2]-n[2];return a*a+o*o+i*i}};function yr(e){return"_lab"in e?e._lab:e._lab=_r.rgb_to_lab({R:e.r,G:e.g,B:e.b})}var Y=Jt();function wr(e){let t=[];for(let r=0;r<e.height;r++){let n=[];for(let a=0;a<e.width;a++){let o=4*(r*e.width+a);e.data[o+3]===255?n.push((e.data[o+2]<<16)+(e.data[o+1]<<8)+e.data[o]):n.push(-1)}t.push(n)}return{pixels:t,width:e.width,height:e.height}}function Fn(e,t,r,n,a,o){let i=document.createElement("canvas");i.width=e.width,i.height=e.height,i.getContext("2d").putImageData(e,0,0);let p=document.createElement("canvas");p.width=e.width,p.height=e.height;let c=p.getContext("2d");return c.filter=`saturate(${n}%) brightness(${t}%) contrast(${r}%)`,a&&(c.scale(1,-1),c.translate(0,-e.height)),o&&(c.scale(-1,1),c.translate(-e.width,0)),c.drawImage(i,0,0),c.getImageData(0,0,e.width,e.height)}function En(e){let{mark:t}=O(),{data:r,width:n,height:a}=e;for(let i of[8,7,6,5,4,3,2])for(let d=0;d<i;d++)for(let p=0;p<i;p++){let c=!0;for(let s=d;s<n;s+=i){for(let u=p;u<a;u+=i){for(let f=1;f<i;f++){for(let g=1;g<i;g++)if(!o(s+f,u+g,s,u)){c=!1;break}if(!c)break}if(!c)break}if(!c)break}if(c){let s=new ImageData(Math.floor((n-d)/i),Math.floor((a-p)/i)),u=0;for(let f=0;f<s.height;f++)for(let g=0;g<s.width;g++){let m=((f*i+p)*n+g*i+d)*4,C=(f*s.width+g)*4;s.data[C]=r[m],s.data[C+1]=r[m+1],s.data[C+2]=r[m+2],s.data[C+3]=r[m+3]}return t(`Descale with match ${n}x${a} (${i} ${d} ${p}) -> ${s.width}x${s.height}`),s}}return t("Descale with no match"),e;function o(i,d,p,c){if(i>=e.width||d>=e.height)return!0;let s=(d*e.width+i)*4,u=(c*e.width+p)*4;return r[s]===r[u]&&r[s+1]===r[u+1]&&r[s+2]===r[u+2]&&r[s+3]===r[u+3]}}function Mn(e,t,r){let n=new Array(e.width*e.height),a=1/0,o=-1/0,i=1/0,d=-1/0;if(isNaN(t))i=a=0,d=e.width-1,o=e.height-1,n.fill(!0,0,n.length);else{n.fill(!1,0,n.length);for(let s=0;s<e.height;s++)for(let u=0;u<e.width;u++)!c(ne(e,u,s))&&(i=Math.min(i,u),d=Math.max(d,u),a=Math.min(a,s),o=Math.max(o,s),n[s*e.width+u]=!0,r&&(u!==0&&(n[s*e.width+(u-1)]=!0),s!==0&&(n[(s-1)*e.width+u]=!0),u!==e.width-1&&(n[s*e.width+(u+1)]=!0),s!==e.height-1&&(n[(s+1)*e.width+u]=!0)));r&&(i!==0&&i--,a!==0&&a--,d!==e.width-1&&d++,o!==e.height-1&&o++)}let p=new ImageData(d-i+1,o-a+1);for(let s=0;s<p.height;s++)for(let u=0;u<p.width;u++)p.data[(s*p.width+u)*4+3]=0;for(let s=a;s<=o;s++)for(let u=i;u<=d;u++){let f=ne(e,u,s),g=((s-a)*p.width+(u-i))*4;n[s*e.width+u]&&(p.data[g+0]=f>>0&255,p.data[g+1]=f>>8&255,p.data[g+2]=f>>16&255,p.data[g+3]=255)}return p;function c(s){return isNaN(t)?!1:t===0?(s>>24)*255===0:(s&16777215)===(t&16777215)}}function Dr(e){let t=document.createElement("canvas");t.width=e.width,t.height=e.height;let r=t.getContext("2d");return r.drawImage(e,0,0,e.width,e.height),r.getImageData(0,0,e.width,e.height)}function Gn(e){let t=!1;for(let r=0;r<e.height;r++){let n=r===0||r===e.height-1;for(let a=0;a<e.width;a++){let o=4*(r*e.width+a);if(e.data[o+3]===0)return 0;(n||a===0||a===e.width-1)&&e.data[o+0]===255&&e.data[o+1]===0&&e.data[o+2]===255&&(t=!0)}}return t?16711935:kr(e)}function kr(e){let t=[ne(e,0,0),ne(e,0,e.height-1),ne(e,e.width-1,0),ne(e,e.width-1,e.height)];return t.sort(),t[1]===t[2]?t[1]:0}function ne(e,t,r){let n=(r*e.width+t)*4;return e.data[n+0]<<0|e.data[n+1]<<8|e.data[n+2]<<16|e.data[n+3]<<24}function Ar(e,t){let{mark:r}=O();r("Image -> RGBA");let n;switch(t.transparency){case"auto":r("Infer transparency"),n=Gn(e);break;case"alpha":n=0;break;case"none":n=NaN;break;case"magenta":n=4294902015;break;case"corners":n=kr(e);break}let a=t.descale?En(e):e,o=Mn(a,n,t.keepOutline);r("Apply transparency & crop");let i=[o.width,o.height],d=On(o,256)?96:480,p=Rn(i,d),c=p===i?o:Tn(o,p),s=Fn(c,t.brightness*10+100,t.contrast*10+100,t.saturation*10+100,t.flip,t.mirror);return r("Adjust image"),s}function Rn(e,t){if(e[0]<=t&&e[1]<=t)return e;let r=Math.max(e[0]/t,e[1]/t);return[Math.round(e[0]/r),Math.round(e[1]/r)]}function Br(e,t,r){let{mark:n}=O(),a;switch(t.palette){case"dmc":a=Y.sets.filter(p=>p.name==="dmc")[0].colors;break;case"lego":a=Y.sets.filter(p=>p.name==="lego")[0].colors;break;case"artkal-all-mini":a=Y.sets.filter(p=>p.name==="Artkal Mini")[0].colors;break;case"artkal-mini-starter":a=Y.sets.filter(p=>p.name==="Artkal Mini Starter")[0].colors;break;case"perler-all":a=Y.sets.filter(p=>p.name==="All Perler")[0].colors;break;case"perler-multimix":a=Y.sets.filter(p=>p.name==="Perler Multi Mix")[0].colors;break;case"evoretro":a=Y.sets.filter(p=>p.name==="EvoRetro")[0].colors;break;case"funzbo":a=Y.sets.filter(p=>p.name==="Funzbo")[0].colors;break;case"all":a=void 0;break;default:gr(t.palette,"Unknown palette")}let o=Cr(e),i;a===void 0?i=!1:r.dithering==="auto"?i=o.length>256:i=r.dithering==="on";let d;if(i)d=Vn(e,a);else{let p=vr(o,a,t);n("Create palette"),d=br(e,p),n("Apply palette")}return{rgbaArray:e,quantized:d}}function Sr(e){let t=In(e),r=new Array(e.height),n=new Map;for(let a=0;a<t.length;a++)n.set(t[a].target,a);for(let a=0;a<e.height;a++){r[a]=new Array(e.width);for(let o=0;o<e.width;o++){let i=e.pixels[a][o];i===void 0?r[a][o]=-1:r[a][o]=n.get(i)}}return{pixels:r,width:e.width,height:e.height,partList:t}}function In(e){let t=new Map;for(let n=0;n<e.height;n++)for(let a=0;a<e.width;a++){let o=e.pixels[n][a];if(o===void 0)continue;let i=t.get(o);i===void 0?t.set(o,{count:1,target:o,symbol:"#"}):i.count++}let r=[];for(let n of t.entries())r.push(n[1]);r.sort((n,a)=>a.count-n.count);for(let n=0;n<r.length;n++)r[n].symbol=ur[n];return r}function xr(e){return{pixels:e.partList.reduce((t,r)=>t+r.count,0)}}function it(e,t=1/0){let r=new Uint8ClampedArray(e.width*e.height*4),n=e.partList.map(d=>d.target);for(let d=0;d<e.width;d++)for(let p=0;p<e.height;p++){let c=(p*e.width+d)*4,s=e.pixels[p][d];if(s!==-1&&s<t){let u=e.partList[s];r[c+0]=u.target.r,r[c+1]=u.target.g,r[c+2]=u.target.b,r[c+3]=255}else r[c+3]=0}let a=document.createElement("canvas");a.width=e.width,a.height=e.height;let o=a.getContext("2d"),i=o.createImageData(e.width,e.height);return i.data.set(r),o.putImageData(i,0,0),a.toDataURL()}function Tn(e,t){let r=document.createElement("canvas");r.width=e.width,r.height=e.height,r.getContext("2d").putImageData(e,0,0);let n=document.createElement("canvas");[n.width,n.height]=t;let a=n.getContext("2d");return a.scale(t[0]/e.width,t[1]/e.height),a.drawImage(r,0,0),a.getImageData(0,0,t[0],t[1])}function Vn(e,t){let r=O(),n=e.pixels.map(c=>c.map(s=>s&255)),a=e.pixels.map(c=>c.map(s=>s>>8&255)),o=e.pixels.map(c=>c.map(s=>s>>16&255));r.mark("Create channel arrays");let i=new Array(e.height);for(let c=0;c<e.height;c++)if(i[c]=new Array(e.width),c%2===0)for(let s=0;s<e.width;s++)d(s,c,!0);else for(let s=e.width-1;s>=0;s--)d(s,c,!1);return r.mark("Dither"),console.trace(),{pixels:i,width:e.width,height:e.height};function d(c,s,u){if(e.pixels[s][c]===-1)i[s][c]=void 0;else{let f=1/0,g;for(let b of t){let h=ot.rgb2(n[s][c],a[s][c],o[s][c],b);h<f&&(g=b,f=h)}i[s][c]=g;let m=g.r-n[s][c],C=g.g-a[s][c],v=g.b-o[s][c];u?(p(c+1,s+0,m,C,v,7/16),p(c-1,s+1,m,C,v,3/16),p(c+0,s+1,m,C,v,5/16),p(c+1,s+1,m,C,v,1/16)):(p(c-1,s+0,m,C,v,7/16),p(c+1,s+1,m,C,v,3/16),p(c+0,s+1,m,C,v,5/16),p(c-1,s+1,m,C,v,1/16))}}function p(c,s,u,f,g,m){c<0||c>=e.width||s<0||s>=e.height||(n[s][c]-=u*m,a[s][c]-=f*m,o[s][c]-=g*m)}}function On(e,t){let r=new Set,n=0;for(let a=0;a<e.height;a++){for(let o=0;o<e.width;o++)r.add(e.data[n+0]<<0|e.data[n+1]<<8|e.data[n+2]<<16|e.data[n+3]<<24),n+=4;if(r.size>t)return!0}return!1}var R=({code:e})=>l("a",{href:"https://amzn.to/"+e,rel:"noreferrer",target:"_blank",title:"Buy",children:"\u{1F6D2}"}),Le={palette:[["artkal-mini-starter",l("span",{children:["Artkal Mini Starter ",l(R,{code:"3wThLo8"})]})],["artkal-all-mini","All Artkal Mini"],["perler-multimix",l("span",{children:["Perler Multi Mix ",l(R,{code:"2WjPiLU"})]})],["perler-all",l("span",{children:["All Perler ",l(R,{code:"3kPFwL9"})]})],["evoretro",l("span",{children:["Evoretro ",l(R,{code:"39Lp3kO"})]})],["funzbo",l("span",{children:["Funzbo ",l(R,{code:"3GDH7N3"})]})],["lego",l("span",{children:["LEGO ",l(R,{code:"3omMszN"})]})],["dmc",l("span",{children:["DMC ",l(R,{code:"3D4PRtf"})]})],["all","All Colors"]],size:[["artkal-mini",l("span",{children:["Artkal Mini",l(R,{code:"3eNjvcm"})]})],["perler-mini",l("span",{children:["Perler Mini",l(R,{code:"2WcXJIH"})]})],["perler",l("span",{children:["Perler",l(R,{code:"36U2tov"})]})],["evoretro",l("span",{children:["Evoretro",l(R,{code:"39Lp3kO"})]})],["funzbo",l("span",{children:["Funzbo",l(R,{code:"3GDH7N3"})]})],["16 ct",l("span",{title:"16 threads per inch (cross-stitch)",children:"16 ct"})],["30 ct",l("span",{title:"30 threads per inch (cross-stitch)",children:"30 ct"})],["lego","LEGO \u2122"]],colorMatch:[["ciede2000","CIEDE2000"],["ictcp","ICtCp"],["rgb","RGB"]]},lt={transparency:[["auto","Auto"],["alpha","Alpha Channel"],["magenta","Magenta"],["corners","Corners"],["none","None"]],dithering:[["auto","Auto"],["on","On"],["off","Off"]]},ye={planStyle:[["symbolspans","Symbols + Spans"],["spans","Spans"],["symbols","Symbols"],["none","None"]],grid:[["auto","Auto"],["50","50"],["25","25"],["10","10"],["none","None"]],background:[["#777","Grey"],["#000","Black"],["#FFF","White"],["url(#checkPattern)","Checker"],["transparent","Transparent"],["url(#wood)","Wood"]],refobj:[["none","None"],["quarter","Quarter"],["dollar","Dollar"],["credit","Bank Card"]]};j();var zn=()=>{},z=Ne(zn);function Pr(e){return de(z.Provider,{value:e.value},e.children)}async function Lr(e,t){$n(()=>Hn(e,t))}async function $n(e){let t="pdf-script-tag";if(document.getElementById(t)===null){let n=document.createElement("script");n.id=t,n.onload=()=>{e()},n.src="https://github.com/foliojs/pdfkit/releases/download/v0.12.1/pdfkit.standalone.js",document.head.appendChild(n)}else e()}function Hn(e,t){let r=ct(.3333333333333333),n=new PDFDocument({size:t.paperSize}),a=n.pipe(blobStream());t.style==="legend"&&Un(n,e);let o=n.page.width,i=n.page.height,d=o-r*2,p=i-r*2,c=n.heightOfString("Testing"),s;t.imageSize==="actual"?s=ut(t.pitch):t.imageSize==="legible"?t.breakStrategy==="grid"?s=.99*Math.min((d-c)/t.carveSize[0],(p-c)/t.carveSize[1]):s=ut(4):e.width>=e.height?s=Math.min((d-c)/e.height,(p-c)/e.width):s=Math.min((d-c)/e.width,(p-c)/e.height);let u;t.imageSize==="single-page"?u=[1/0,1/0]:t.breakStrategy==="grid"?u=t.carveSize:u=[Math.floor((d-c)/s),Math.floor((p-c)/s)];let f=Nn(e,u),g=Math.max.apply(Math.max,f.map(h=>h.width)),m=Math.max.apply(Math.max,f.map(h=>h.height)),C={width:s*g,height:s*m},v=C.width*1.2>C.height?"top":"side",b={width:C.width+(v==="side"?c:0),height:C.height+(v==="top"?c:0)};if(t.debug&&(n.rect(r,r,o-r*2,i-r*2),n.stroke("red")),t.style==="step-by-step"){let h=[];for(let y of f){let D=[];for(let w=0;w<y.height;w++){D[w]=[];for(let B=0;B<y.width;B++)D[w][B]=!1}for(let w=0;w<e.partList.length;w++)Fr(y,B=>B===e.partList[w])&&h.push({partIndex:w,slice:y})}let _=st(h.length,o,i,r,b.width,b.height),k=f.length>1;for(let y of h){let w=_.shift().next(n,y.slice.width*s,y.slice.height*s);jn({doc:n,image:e,partIndex:y.partIndex,slice:y.slice,pitch:s,textPlacement:v,cellHeaderHeightPts:c,multipleSlices:k,debug:t.debug}),w()}}else if(t.style==="color"){let h=st(f.length,o,i,r,b.width,b.height);for(let _ of f){let y=h.shift().next(n,_.width*s,_.height*s);t.debug&&(n.rect(0,0,_.width*s,_.height*s),n.stroke("blue"));for(let D=0;D<e.partList.length;D++){for(let B=_.y;B<_.y+_.height;B++){let x=B-_.y;for(let A=_.x;A<_.x+_.width;A++){let S=A-_.x;e.pixels[B][A]===D&&n.rect(S*s,x*s,s,s)}}let w=e.partList[D].target;n.fill([w.r,w.g,w.b])}y()}}else if(t.style==="legend"){let h=st(f.length,o,i,r,b.width,b.height);for(let _ of f){let y=h.shift().next(n,_.width*s,_.height*s);n.fontSize(s),n.font("Courier");for(let D=_.y;D<_.y+_.height;D++){let w=D-_.y;for(let B=_.x;B<_.x+_.width;B++){let x=B-_.x,A=e.pixels[D][B];A!==-1&&n.text(e.partList[A].symbol,x*s,w*s,{align:"center",baseline:"middle",height:s,width:s})}}y()}}a.on("finish",()=>{window.open(a.toBlobURL("application/pdf"),"_blank")}),n.end()}function Un(e,t){e.save(),e.fontSize(16);let r=5+Math.max.apply(Math,t.partList.map(u=>e.widthOfString(u.symbol))),n=5+Math.max.apply(Math,t.partList.map(u=>e.widthOfString(u.target.code??""))),a=5+Math.max.apply(Math,t.partList.map(u=>e.widthOfString(u.count.toLocaleString()))),o=32,i=5+Math.max.apply(Math,t.partList.map(u=>e.widthOfString(u.target.name))),d=2,p=d*2+e.heightOfString("I like you, person reading this code");e.translate(ct(1),ct(1));let c=0,s=0;for(let u=0;u<t.partList.length;u++){c=0,e.text(t.partList[u].symbol,c,s+d,{width:r,height:p,align:"center"}),c+=r,e.rect(c,s+d,o-5,p-d*2),e.fill([t.partList[u].target.r,t.partList[u].target.g,t.partList[u].target.b]),e.fillColor("black"),c+=o,e.text(t.partList[u].count.toLocaleString(),c,s+d,{width:a-5,align:"right"}),c+=a;let f=t.partList[u].target.code;f!==void 0&&(e.text(f,c,s+d,{width:n}),c+=n),e.text(t.partList[u].target.name,c,s+d,{width:i}),c+=i,e.moveTo(0,s),e.lineTo(c,s),e.stroke("grey"),s+=p}e.restore(),e.addPage()}function Nn(e,t){let r=nt(e.width,e.height,t[0],t[1]),n=nt(e.width,e.height,t[1],t[0]);return(r.length<=n.length?r:n).map(o=>({image:e,width:o.width,height:o.height,x:o.x,y:o.y,row:o.row,col:o.col,forEach:Wn(e,o.x,o.y,o.width,o.height)})).filter(o=>Fr(o,i=>!!i))}function Fr(e,t){for(let r=e.x;r<e.x+e.width;r++)for(let n=e.y;n<e.y+e.height;n++)if(t(e.image.partList[e.image.pixels[n][r]]))return!0;return!1}function Wn(e,t,r,n,a,o){return function(i){for(let d=t;d<t+n;d++)for(let p=r;p<r+a;p++){let c=e.pixels[p][d],s=e.partList[c];s&&(!o||o(s))&&i(d-t,p-r,s)}}}function jn(e){let{image:t,partIndex:r,doc:n,slice:a,pitch:o}=e,i={width:a.width*o,height:a.height*o},d=e.multipleSlices?`${me(t.partList[r].target)} Row ${a.row} Col ${a.col}`:`${me(t.partList[r].target)}`;e.textPlacement==="side"?(e.debug&&(n.rect(0,0,i.width+e.cellHeaderHeightPts,i.height),n.stroke("blue")),n.translate(e.cellHeaderHeightPts,0),n.save(),n.rotate(-90),n.translate(-i.height,0),n.text(d,0,0,{baseline:"bottom",align:"center",width:i.height,ellipsis:!0}),n.restore()):(e.debug&&(n.rect(0,0,i.width,i.height+e.cellHeaderHeightPts),n.stroke("blue")),n.translate(0,e.cellHeaderHeightPts),n.text(d,0,0,{baseline:"bottom",align:"center",width:i.width,ellipsis:!0})),n.rect(0,0,i.width,i.height),n.lineWidth(1),n.stroke("grey"),p(),n.fill("black"),c(),n.lineWidth(1.3),n.stroke("grey");function p(){for(let s=a.y;s<a.y+a.height;s++){let u=(s-a.y+.5)*o;for(let f=a.x;f<a.x+a.width;f++)if(t.pixels[s][f]===r){let g=(f-a.x+.5)*o;n.circle(g,u,o/2.5)}}}function c(){let s=new Map;for(let m=a.y;m<a.y+a.height;m++)g(a.x,a.x+a.width,C=>f(C,m),C=>u(C,m));for(let m=a.x;m<a.x+a.width;m++)g(a.y,a.y+a.height,C=>f(m,C),C=>u(m,C));function u(m,C){let v=m+"-"+C;if(s.has(v))return;s.set(v,!0);let b=(m-a.x)*o,h=(C-a.y)*o;n.moveTo(b+o*.3,h+o*.3),n.lineTo(b+o*.7,h+o*.7),n.moveTo(b+o*.3,h+o*.7),n.lineTo(b+o*.7,h+o*.3)}function f(m,C){let v=t.pixels[C][m];return v<r&&v!==-1}function g(m,C,v,b){let h=!1;for(let _=m;_<C;_++)v(_)?(h||b(_),h=!0):(h&&b(_-1),h=!1);h&&b(C-1)}}}function st(e,t,r,n,a,o){let i=ut(9),d=[],p=t-n*2,c=r-n*2,s={maxCols:Math.floor((i+p)/(i+a)),maxRows:Math.floor((i+c)/(i+o))},u={maxCols:Math.floor((i+p)/(i+o)),maxRows:Math.floor((i+c)/(i+a))},f=u.maxRows*u.maxCols>s.maxRows*s.maxCols&&s.maxRows*s.maxCols<e,g=f?u:s;if(g.maxRows*g.maxCols===0)throw new Error("Can't do this layout");for(;;){if(g.maxCols>=g.maxRows){if((g.maxCols-1)*g.maxRows>=e){g.maxCols--;continue}if((g.maxRows-1)*g.maxCols>=e){g.maxRows--;continue}}else{if((g.maxRows-1)*g.maxCols>=e){g.maxRows--;continue}if((g.maxCols-1)*g.maxRows>=e){g.maxCols--;continue}}break}let m=f?o:a,C=f?a:o,v=t-n*2-g.maxCols*m,b=r-n*2-g.maxRows*C,h=v/(g.maxCols+1),_=b/(g.maxRows+1),k=m+h,y=C+_;console.log(JSON.stringify({pageWidthPts:t,pageHeightPts:r,cellWidthPts:a,cellHeightPts:o,densestUnrotatedLayout:s,densestRotatedLayout:u,isRotated:f,densestLayout:g,unallocatedX:v,unallocatedY:b,xInterval:k,yInterval:y,xJustification:h,yJustification:_},void 0,2));let D=!0;for(;;){let x=!0;if(f)for(let A=g.maxCols-1;A>=0;A--)for(let S=0;S<g.maxRows;S++){if(w(A,S,x))return d;x=!1}else for(let A=0;A<g.maxRows;A++)for(let S=0;S<g.maxCols;S++){if(w(S,A,x))return d;x=!1}D=!1}function w(x,A,S){if(B(S&&!D,n+h+x*k,n+_+A*y),d.length===e)return!0}function B(x,A,S){d.push({next(F,I,$){x&&F.addPage();let oe=m-(f?$:I),Z=C-(f?I:$);return F.save(),F.translate(A+oe/2,S+Z/2),f&&(F.rotate(90),F.translate(0,-m)),()=>{F.restore()}}})}}function ct(e){return e*72}function ut(e){return e/25.4*72}function Er(e){let t=U(z);return l("div",{class:"print-dialog",children:[l("div",{class:"print-options",children:[l(Kn,{...e}),l(Yn,{...e}),l(qn,{...e}),l(Xn,{...e})]}),l("div",{class:"print-buttons",children:[l("button",{class:"cancel",onClick:()=>t("ui","isPrintOpen",!1),children:"Cancel"}),l("button",{class:"print",onClick:()=>r(),children:["Print\xA0",l("img",{class:"pdf-logo",src:"./pdf-logo.png"})]})]})]});function r(){let n={style:e.settings.format,paperSize:e.settings.paperSize,breakStrategy:e.settings.breakStrategy,imageSize:e.settings.imageSize,carveSize:Pe(e.gridSize),pitch:fe(e.gridSize),filename:e.filename.replace(".png",""),debug:window.location.host.indexOf("localhost")===0};window.clarity?.("event","print"),Lr(e.image,n)}}var Kn=Fe(({image:e})=>({title:"Format",key:"format",values:[{value:"step-by-step",title:"Single Color",description:"Print one black-and-white grid per color. Best for laser printers or when colors are difficult to tell apart.",icon:l(Jn,{image:e})},{value:"color",title:"Color Image",description:"Print a single color image. Best for color printers and images with fewer colors.",icon:l(Zn,{image:e})},{value:"legend",title:"Legend",description:"Print a grid of letters corresponding to the legend",icon:l(Qn,{image:e})}]})),Yn=Fe(()=>({key:"paperSize",title:"Paper Size",values:[{title:"Letter",value:"letter",description:'8.5" x 11"',icon:l("span",{class:"letter-icon"})},{title:"A4",value:"a4",description:"210mm x 297mm",icon:l("span",{class:"a4-icon"})}]})),qn=Fe(()=>({key:"imageSize",title:"Image Size",values:[{title:"Page",value:"single-page",description:"Scale the image to fit a single page",icon:l("span",{class:"size-stretch",children:"\u26F6"})},{title:"Actual",value:"actual",description:"Print at actual size. Multiple pages will be generated if necessary",icon:l("span",{class:"size-actual",children:"1:1"})},{title:"Legible",value:"legible",description:"Print at a legible size. Multiple pages will be generated if necessary",icon:l("span",{class:"size-legible",children:"\u{1F441}"})}]})),Xn=Fe(()=>({key:"breakStrategy",title:"Page Breaking",values:[{title:"Grid",value:"grid",description:"Split large images based on the pegboard grid size",icon:l("span",{class:"break-grid",children:"\u{1F533}"})},{title:"Page",value:"page",description:"Split large images based on the page size",icon:l("span",{class:"break-paper",children:"\u{1F4C4}"})}]}));function Jn(e){let[t,r]=Ht(0),n=H(null);return K(()=>{o();let i=window.setInterval(a,600);return()=>{window.clearInterval(i)}}),l("img",{class:"step-by-step-preview",ref:n});function a(){r((t+1)%(e.image.partList.length+3))}function o(){n.current&&(n.current.src=it(e.image,t))}}function Zn(e){return l("img",{src:it(e.image)})}function Qn(e){let n=Math.floor(e.image.width/2)-Math.floor(2.5),a=Math.floor(e.image.height/2)-Math.floor(4/2),o=[];for(let i=Math.max(a,0);i<Math.min(e.image.height,a+4);i++){let d="";for(let p=Math.max(n,0);p<Math.min(e.image.width,n+5);p++){let c=e.image.partList[e.image.pixels[i][p]];d=d+(c?.symbol??" ")}o.push(d)}return l("span",{children:l("pre",{children:o.join(`
`)})})}function Fe(e){return function(t){let r=U(z),n=e(t);return l("div",{class:"print-setting-group",children:[l("h1",{children:n.title}),l("div",{class:"print-setting-group-options",children:n.values.map(a=>l("label",{children:[l("input",{type:"radio",name:n.key,checked:a.value===t.settings[n.key],onChange:()=>{r("print",n.key,a.value)}}),l("div",{class:"option",children:[l("h3",{children:a.title}),a.icon]})]}))}),l("span",{class:"description",children:n.values.filter(a=>a.value===t.settings[n.key])[0]?.description})]})}}async function Mr(e,t){let{width:r,height:n,pixels:a,partList:o}=e,i=new Map;for(let g=0;g<n;g++)for(let m=0;m<r;m++){let C=a[g][m];if(C!=null){let v=o[C];if(!v)continue;let b=J(v.color);i.has(b)||i.set(b,[]),i.get(b).push({x:m,y:g})}}let d=[],p=[],c=new Map,s=1;for(let[g,m]of i.entries())for(let C of m){let v=C.x,b=C.y,h=t.heightScale,_=[[v,b,0],[v+1,b,0],[v+1,b+1,0],[v,b+1,0],[v,b,h],[v+1,b,h],[v+1,b+1,h],[v,b+1,h]],k=[];for(let D of _){let w=D.join(",");c.has(w)?k.push(c.get(w)):(c.set(w,s),d.push(`<vertex x="${D[0]}" y="${D[1]}" z="${D[2]}" />`),k.push(s),s++)}let y=k;p.push(`<triangle v1="${y[0]}" v2="${y[1]}" v3="${y[2]}" />`),p.push(`<triangle v1="${y[0]}" v2="${y[2]}" v3="${y[3]}" />`),p.push(`<triangle v1="${y[4]}" v2="${y[6]}" v3="${y[5]}" />`),p.push(`<triangle v1="${y[4]}" v2="${y[7]}" v3="${y[6]}" />`),p.push(`<triangle v1="${y[0]}" v2="${y[4]}" v3="${y[5]}" />`),p.push(`<triangle v1="${y[0]}" v2="${y[5]}" v3="${y[1]}" />`),p.push(`<triangle v1="${y[1]}" v2="${y[5]}" v3="${y[6]}" />`),p.push(`<triangle v1="${y[1]}" v2="${y[6]}" v3="${y[2]}" />`),p.push(`<triangle v1="${y[2]}" v2="${y[6]}" v3="${y[7]}" />`),p.push(`<triangle v1="${y[2]}" v2="${y[7]}" v3="${y[3]}" />`),p.push(`<triangle v1="${y[3]}" v2="${y[7]}" v3="${y[4]}" />`),p.push(`<triangle v1="${y[3]}" v2="${y[4]}" v3="${y[0]}" />`)}let f=`<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
    <metadata name="Application">firaga.io</metadata>
    <resources>
        <object id="1" type="model">
            ${`
        <mesh>
            <vertices>
                ${d.join(`
                `)}
            </vertices>
            <triangles>
                ${p.join(`
                `)}
            </triangles>
        </mesh>`}
        </object>
    </resources>
    <build>
        <item objectid="1" />
    </build>
</model>`;await Ir(async g=>{let m=new g;m.file("[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
    <Default Extension="model" ContentType="application/vnd.ms-package.3dmodel+xml" />
</Types>`),m.file("_rels/.rels",`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="3D/model.model" />
</Relationships>`),m.file("3D/model.model",f);let C=await m.generateAsync({type:"blob"});Rr(C,`${t.filename}.3mf`)})}async function Gr(e,t){let{width:r,height:n,pixels:a,partList:o}=e,i=new Map,d=new Map;for(let u=0;u<n;u++)for(let f=0;f<r;f++){let g=a[u][f];if(g!=null){let m=o[g];if(!m)continue;let C=J(m.color);if(!i.has(C)){let b=[];for(let h=0;h<n;h++){b[h]=[];for(let _=0;_<r;_++)b[h][_]=!1}i.set(C,b),d.set(C,m.color.name)}let v=i.get(C);v[u][f]=!0}}let p=[];for(let[u]of i.entries()){let f=u.substring(1).toLowerCase();p.push({name:`mask_${f}.png`,color:u})}let c=ea(r,n,p,t.heightScale),s=`# 3D Model from firaga.io

This package contains:
- masks/: Directory with black/white PNG images for each color
- model.scad: OpenSCAD script that loads all masks and creates a 3D model

To use:
1. Open model.scad in OpenSCAD
2. Render (F6) to generate the 3D model
3. Export as STL or other formats

You can modify the HEIGHT_SCALE parameter in model.scad to adjust the height of peaks.
`;await Ir(async u=>{let f=new u;for(let[m,C]of i.entries()){let v=m.substring(1).toLowerCase(),b=await ta(r,n,C);f.file(`masks/mask_${v}.png`,b)}f.file("model.scad",c),f.file("README.txt",s);let g=await f.generateAsync({type:"blob"});Rr(g,`${t.filename}-openscad.zip`)})}function ea(e,t,r,n){return`// 3D Model generated by firaga.io
// Adjust HEIGHT_SCALE below to change the height of the 3D model

HEIGHT_SCALE = ${n};
IMAGE_WIDTH = ${e};
IMAGE_HEIGHT = ${t};

// Layer: Load and display all color masks
union() {
${r.map(a=>`    surface(file = "masks/mask_${a.color.substring(1).toLowerCase()}.png", center = true, invert = true)
        scale([1, 1, HEIGHT_SCALE])
        color("${a.color}")
        cube([IMAGE_WIDTH, IMAGE_HEIGHT, 1]);`).join(`

`)}
}
`}async function ta(e,t,r){return new Promise((n,a)=>{let o=document.createElement("canvas");o.width=e,o.height=t;let i=o.getContext("2d");if(!i){a(new Error("Could not get canvas context"));return}let d=i.createImageData(e,t);for(let p=0;p<t;p++)for(let c=0;c<e;c++){let s=r[p][c]?255:0,u=(p*e+c)*4;d.data[u]=s,d.data[u+1]=s,d.data[u+2]=s,d.data[u+3]=255}i.putImageData(d,0,0),o.toBlob(p=>{p?n(p):a(new Error("Could not create blob"))},"image/png")})}function Rr(e,t){let r=URL.createObjectURL(e),n=document.createElement("a");n.href=r,n.download=t,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(r)}async function Ir(e){if(typeof window<"u"&&window.JSZip)await e(window.JSZip);else{let t=document.createElement("script");t.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",t.onload=async()=>{await e(window.JSZip)},t.onerror=()=>{console.error("Failed to load JSZip")},document.head.appendChild(t)}}function Tr(e){let t=U(z);return l("div",{class:"threed-dialog",children:[l("div",{class:"threed-options",children:[l(ra,{...e}),l(na,{...e})]}),l("div",{class:"threed-buttons",children:[l("button",{class:"cancel",onClick:()=>t("ui","is3dOpen",!1),children:"Cancel"}),l("button",{class:"export",onClick:()=>r(),children:"Export 3D"})]})]});function r(){let n={format:e.settings.format,heightScale:e.settings.heightScale,filename:e.filename.replace(".png","")};window.clarity?.("event","3d-export"),n.format==="3mf"?Mr(e.image,n):n.format==="openscad-masks"&&Gr(e.image,n),t("ui","is3dOpen",!1)}}var ra=aa(({image:e})=>({title:"Format",key:"format",values:[{value:"3mf",title:"3MF Mesh",description:"Export as a 3D triangle mesh in 3MF format. Each color is a separate material. Compatible with most 3D printers and viewers.",icon:l("span",{class:"threed-format-icon",children:"\u{1F537}"})},{value:"openscad-masks",title:"OpenSCAD",description:"Export as a zip file containing masks and an OpenSCAD script. Edit heights and combine shapes in OpenSCAD.",icon:l("span",{class:"threed-format-icon",children:"\u{1F4E6}"})}]})),na=oa(({image:e})=>({title:"Height Scale",key:"heightScale",min:.1,max:5,step:.1,description:"Scale the height of the 3D model. Higher values create taller peaks."}));function aa(e){return function(t){let r=U(z),n=e(t);return l("div",{class:"threed-setting-group",children:[l("h1",{children:n.title}),l("div",{class:"threed-setting-group-options",children:n.values.map(a=>l("label",{children:[l("input",{type:"radio",name:n.key,checked:a.value===t.settings[n.key],onChange:()=>{r("threeD",n.key,a.value)}}),l("div",{class:"option",children:[l("h3",{children:a.title}),a.icon]})]}))}),l("span",{class:"description",children:n.values.filter(a=>a.value===t.settings[n.key])[0]?.description})]})}}function oa(e){return function(t){let r=U(z),n=e(t),a=t.settings[n.key];return l("div",{class:"threed-setting-group slider-group",children:[l("h1",{children:n.title}),l("input",{type:"range",min:n.min,max:n.max,step:n.step,value:typeof a=="number"?a:1,onChange:o=>{let i=parseFloat(o.target.value);r("threeD",n.key,i)}}),l("span",{class:"slider-value",children:typeof a=="number"?a.toFixed(1):a}),l("span",{class:"description",children:n.description})]})}}var ae="http://www.w3.org/2000/svg",la=Vr(),sa={quarter:{url:"https://upload.wikimedia.org/wikipedia/commons/4/44/2014_ATB_Quarter_Obv.png",width:24.26,height:24.26},dollar:{url:"https://upload.wikimedia.org/wikipedia/commons/2/23/US_one_dollar_bill%2C_obverse%2C_series_2009.jpg",width:156.1,height:66.3},credit:{url:"https://upload.wikimedia.org/wikipedia/commons/2/23/CIDSampleAmex.png",width:85.6,height:53.98}};function Or(e){let{image:t,displaySettings:r}=e,{planStyle:n}=r,a=r.background==="#000"||r.background==="#777";return l("svg",{class:"plan",xmlns:"http://www.w3.org/2000/svg",viewBox:`-16 -16 ${(t.width+1)*32} ${(t.height+1)*32}`,preserveAspectRatio:"xMidYMid meet",children:[l("style",{children:la}),l("defs",{children:[l("rect",{id:"melted",width:"32",height:"32",rx:"7",ry:"7"}),l("rect",{id:"square",width:"32",height:"32"}),l("rect",{id:"circle",width:"32",height:"32",rx:"16",ry:"16"}),l("pattern",{id:"wood",patternUnits:"userSpaceOnUse",width:"400",height:"400",children:l("image",{href:"https://upload.wikimedia.org/wikipedia/commons/5/50/Mahag%C3%B3ni_001.jpg",x:"0",y:"0",width:"400",height:"400"})}),l("filter",{id:"blurFilter",children:l("feGaussianBlur",{in:"SourceGraphic",stdDeviation:"4"})}),l("pattern",{id:"checkPattern",viewBox:"0 0 32 32",width:"32",height:"32",patternUnits:"userSpaceOnUse",children:[l("rect",{x:"0",y:"0",width:"16",height:"16",fill:"#DDDDDD"}),l("rect",{x:"0",y:"16",width:"16",height:"16",fill:"#999999"}),l("rect",{x:"16",y:"0",width:"16",height:"16",fill:"#999999"}),l("rect",{x:"16",y:"16",width:"16",height:"16",fill:"#DDDDDD"})]})]}),l(ca,{image:t,bg:r.background}),l(pa,{image:t}),l(da,{image:t,grid:r.grid,boardSize:e.gridSize,nudgeGrid:r.nudgeGrid}),l(ua,{image:t,planStyle:e.displaySettings.planStyle,isBackgroundDark:a}),l(ha,{pitch:e.pitch,name:r.refobj})]})}function ca(e){return l("rect",{x:-16,y:-16,width:(e.image.width+1)*32,height:(e.image.height+1)*32,fill:e.bg,filter:e.bg==="url(#checkPattern)"?"url(#blurFilter)":""})}function ua(e){let{image:t,planStyle:r,isBackgroundDark:n}=e,a=H(null);return K(()=>{o()},[t,r,n]),l("g",{ref:a});function o(){dt(a.current);let i=a.current;if(r==="symbols")for(let p=0;p<t.height;p++)for(let c=0;c<t.width;c++){let s=t.partList[t.pixels[p][c]];if(s===void 0)continue;let u=document.createElementNS(ae,"text");u.innerHTML=s.symbol,u.setAttribute("x",(c+.5)*32),u.setAttribute("y",(p+.8)*32),u.setAttribute("text-anchor","middle"),rt(s.target)?u.setAttribute("class","bright"):u.setAttribute("class","dark"),i.appendChild(u)}if(r==="spans"||r==="symbolspans"){let p=function(c,s,u,f){if(r==="spans"){if(s<2)return}else if(c===void 0&&s<3)return;let g=document.createElementNS(ae,"text");if(r==="spans")g.innerHTML=s.toString();else{let m=c?.symbol;m===void 0?g.innerHTML=s.toString():s===1?g.innerHTML=m:s===2?g.innerHTML=`${m}`:g.innerHTML=`${m}\xD7${s.toString()}`}g.setAttribute("x",((u-s/2)*32).toString()),g.setAttribute("y",((f+.8)*32).toString()),g.setAttribute("text-anchor","middle"),(c===void 0?!e.isBackgroundDark:rt(c.target))?g.setAttribute("class","bright"):g.setAttribute("class","dark"),i.appendChild(g)};var d=p;for(let c=0;c<t.height;c++){let s,u=0;for(let f=0;f<=t.width;f++){if(f===t.width){p(s,u,f,c);break}let g=t.partList[t.pixels[c][f]];s===g?u++:(u>0&&p(s,u,f,c),s=g,u=1)}}}}}function da(e){let{image:t,grid:r,nudgeGrid:n}=e,a=H(null);return K(()=>{o()},[t,r,n]),l("g",{ref:a});function o(){dt(a.current);let i=a.current;if(r!=="none"){let d;r==="auto"?d=Pe(e.boardSize)[0]:d=parseInt(r);let p=e.nudgeGrid?hr(t,d):{xOffset:0,yOffset:0};for(let c=0;c<=t.height;c++){let s=document.createElementNS(ae,"line");s.classList.add("gridline"),s.classList.add(d<t.height&&c%d===p.yOffset?"gridmajor":"gridminor"),s.setAttribute("x1",-16),s.setAttribute("x2",t.width*32+16),s.setAttribute("y1",c*32),s.setAttribute("y2",c*32),i.appendChild(s)}for(let c=0;c<=t.width;c++){let s=document.createElementNS(ae,"line");s.classList.add(d<t.width&&c%d===p.xOffset?"gridmajor":"gridminor"),s.setAttribute("x1",c*32),s.setAttribute("x2",c*32),s.setAttribute("y1",-16),s.setAttribute("y2",t.height*32+16),i.appendChild(s)}}}}function pa(e){let t=H(null),{image:r}=e;return K(()=>{dt(t.current),n(t.current)},[e.image]),l("g",{ref:t});function n(a){let{mark:o}=O();for(let i=0;i<r.partList.length;i++){let d=[];for(let s=0;s<r.height;s++)for(let u=0;u<r.width;u++)r.pixels[s][u]===i&&d.push(`M ${u*32} ${s*32} l 32 0 l 0 32 l -32 0 l 0 -32 z`);let p=document.createElementNS(ae,"path");p.setAttribute("d",d.join(" ")),p.setAttribute("fill",pr(r.partList[i].target)),p.setAttribute("stroke-width","1px");let c=document.createElementNS(ae,"title");c.innerHTML=me(r.partList[i].target),p.appendChild(c),a.appendChild(p)}o("Render colors")}}function ha(e){if(e.name==="none")return l("g",{});let t=sa[e.name],r=32/e.pitch;return l("g",{children:l("image",{href:t.url,width:t.width*r,height:t.height*r,opacity:.8,x:0,y:0})})}function dt(e){e&&(e.innerHTML="")}function zr(){let e=U(z);return l("div",{class:"welcome-screen",children:[l("h1",{children:"Welcome to firaga.io!"}),l("p",{children:[l("b",{children:"firaga"})," is an online tool to help you plan and create pixel art crafts using materials like Perler beads, cross-stitching, LEGO, or just regular old paint."]}),l("p",{children:[l("b",{children:"firaga"})," comes preconfigured with color palettes corresponding to many popular crafting products, and uses an ",l("b",{children:"advanced color-matching"})," formula to produce the most accurate results."]}),l("p",{children:[l("b",{children:"firaga"})," also makes high-quality, actual-size ",l("b",{children:"printable plans"})," for both color and black-and-white printers. Placing one of these plans under a transparent pegboard makes for quick and easy crafting."]}),l("p",{children:["For more info, read ",l("a",{href:"https://firaga.io/help",children:"the documentation"}),", or talk to us on ",l("a",{href:"https://twitter.com/firaga_io",children:"Twitter"})," or ",l("a",{href:"https://github.com/SeaRyanC/firaga-io",children:"GitHub"}),". Happy making!"]}),l("button",{class:"cancel",onClick:()=>e("ui","isWelcomeOpen",!1),children:"Let's go!"})]})}var Ee={adjustImage:Me(Ar),palettizeImage:Me(Br),createPartListImage:Me(Sr),imageDataToRgbaArray:Me(wr)};function pt(e,t,r){let n=e;d(n.source.displayName,n.source.uri);function a(h,_,k,y=!1){n={...n,[h]:{...n[h],[_]:k}},y||(pe(l(p,{...n}),r),window.localStorage.setItem("props",JSON.stringify(n,(D,w)=>D.startsWith("_")?void 0:w)),setTimeout(()=>document.body.className="",1e3))}function o(h,_){a(h,_,!n[h][_])}function i(h,_){t.add(h,_),d(h,_)}function d(h,_){fa(_,k=>{a("source","uri",_,!0),a("source","displayName",h,!0),a("source","_decoded",k,!0),a("ui","isUploadOpen",!1)})}function p(h){Ut(()=>{window.addEventListener("paste",function(A){let S=A;for(let F of S.clipboardData?.items??[])if(F.type.indexOf("image")!==-1){let I=F.getAsFile();if(!I)continue;let $=new FileReader;$.onload=oe=>{let Z=oe.target.result;i(I.name,Z)},$.readAsDataURL(I)}}),window.addEventListener("keydown",A=>{if(A.ctrlKey){switch(A.key){case"o":window.clarity?.("event","toggle-upload"),o("ui","isUploadOpen");break;case"p":window.clarity?.("event","toggle-print"),o("ui","isPrintOpen");break;case"3":window.clarity?.("event","toggle-3d"),o("ui","is3dOpen");break;case"l":window.clarity?.("event","toggle-legend"),o("ui","showLegend");break;case"e":window.clarity?.("event","toggle-settings"),o("ui","showSettings");break;default:return}A.preventDefault()}else A.key==="Escape"&&(a("ui","isPrintOpen",!1),a("ui","isUploadOpen",!1),a("ui","is3dOpen",!1))})},[]);let _={},k=h.source._decoded,y=k&&Ee.adjustImage(k,h.image),D=y&&Ee.imageDataToRgbaArray(y),{quantized:w}=D?Ee.palettizeImage(D,h.material,h.image):_,B=w?Ee.createPartListImage(w):void 0,x=fe(h.material.size);return l("div",{class:"app-top",children:[l(Pr,{value:a,children:[h.ui.isWelcomeOpen&&l(zr,{}),l("div",{class:"toolbar",children:[l("button",{title:"Open...",class:`toolbar-button ${h.ui.isUploadOpen?"on":"off"} text`,onClick:()=>o("ui","isUploadOpen"),children:["\u{1F4C2}",l("span",{class:"extended-label",children:"Open"})]}),l("button",{title:"Print...",class:`toolbar-button ${h.ui.isPrintOpen?"on":"off"} text`,onClick:()=>o("ui","isPrintOpen"),children:["\u{1F5A8}\uFE0F",l("span",{class:"extended-label",children:"Print"})]}),l("button",{title:"3D...",class:`toolbar-button ${h.ui.is3dOpen?"on":"off"} text`,onClick:()=>o("ui","is3dOpen"),children:["\u{1F3B2}",l("span",{class:"extended-label",children:"3D"})]}),l("span",{class:"toolbar-divider"}),l("button",{title:"Settings",class:`toolbar-button ${h.ui.showSettings?"on":"off"} text`,onClick:()=>o("ui","showSettings"),children:["\u2699\uFE0F",l("span",{class:"extended-label",children:"Settings"})]}),l("button",{title:"Legend",class:`toolbar-button ${h.ui.showLegend?"on":"off"} text`,onClick:()=>o("ui","showLegend"),children:["\u{1F511}",l("span",{class:"extended-label",children:"Legend"})]}),l("span",{class:"toolbar-divider"}),l("button",{title:"Help",class:`toolbar-button ${h.ui.isWelcomeOpen?"on":"off"} text`,onClick:()=>o("ui","isWelcomeOpen"),children:["\u2754",l("span",{class:"extended-label",children:"Help"})]}),l("a",{class:"toolbar-button off",title:"GitHub",href:"https://github.com/SeaRyanC/firaga-io",children:["\u{1F468}\u200D\u{1F4BB}",l("span",{class:"extended-label",children:"Code"})]}),l("a",{class:"toolbar-button off",title:"Twitter",href:"https://twitter.com/firaga_io",children:["\u{1F4AC}",l("span",{class:"extended-label",children:"Twitter"})]})]}),l("div",{class:"app-main",children:[h.ui.showSettings&&l("div",{class:"settings",children:[l("div",{class:"settings-header",children:["Settings",l("div",{class:"close-button",onClick:()=>a("ui","showSettings",!1),children:"\u2716"})]}),l("div",{class:"settings-list",children:[l(s,{...h.material}),l(c,{...h.image}),l(g,{...h.display})]})]}),B?l(Or,{image:B,pitch:x,displaySettings:h.display,gridSize:h.material.size}):l("div",{children:"Loading..."}),h.ui.showLegend&&B&&l(u,{partList:B.partList,image:B,pitch:fe(h.material.size)})]}),h.ui.isUploadOpen&&l(m,{gallery:t.current,load:(A,S)=>{d(A,S)},requestDelete:A=>{t.remove(A),pe(l(p,{...n}),r)}}),h.ui.isPrintOpen&&B&&l(Er,{image:B,settings:h.print,gridSize:h.material.size,filename:h.source.displayName}),h.ui.is3dOpen&&B&&l(Tr,{image:B,settings:h.threeD,filename:h.source.displayName})]}),l("datalist",{id:"image-ticks",children:l("option",{value:"0",label:"0"})})]})}function c(h){return l("div",{class:"settings-row",children:[l("h1",{children:"Image"}),l("div",{class:"options-row",children:[l("div",{class:"options-group",children:[l("span",{class:"header",children:"Transparency"}),b(h,"image","transparency",lt.transparency),C(h,"image","keepOutline","Keep Outline")]}),navigator.vendor!=="Apple Computer, Inc."&&l("div",{class:"options-group",children:[l("span",{class:"header",children:"Color Adjust"}),v(h,"image","brightness","Brightness"),v(h,"image","contrast","Contrast"),v(h,"image","saturation","Saturation")]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Dithering"}),b(h,"image","dithering",lt.dithering)]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Transforms"}),C(h,"image","flip","Flip"),C(h,"image","mirror","Mirror"),C(h,"image","descale","Undo Upscaling")]})]})]})}function s(h){return l("div",{class:"settings-row",children:[l("h1",{children:"Material"}),l("div",{class:"options-row",children:[l("div",{class:"options-group",children:[l("span",{class:"header",children:"Color Matching"}),b(h,"material","colorMatch",Le.colorMatch),C(h,"material","nodupes","No Duplicates"),C(h,"material","matchBlackAndWhite","Improve Black/White")]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Palette"}),b(h,"material","palette",Le.palette)]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Size"}),b(h,"material","size",Le.size)]})]})]})}function u({partList:h,image:_,pitch:k}){return l("div",{class:"part-list-container",children:[l("table",{class:"part-list",children:[l("thead",{children:l("tr",{children:l("th",{colSpan:5,class:"top-header",children:"Legend"})})}),l("tbody",{children:h.map(y=>l("tr",{children:[l("td",{class:"legend-symbol",children:y.symbol}),l("td",{class:"part-count",children:y.count.toLocaleString()}),y.target.code&&l("td",{class:"color-code",children:y.target.code}),l("td",{class:"color-swatch",style:{color:J(y.target)},children:"\u2B24"}),l("td",{class:"color-name",children:l("span",{class:"colorName",children:y.target.name})})]},y.symbol+y.count+y.target.name))})]}),l(f,{image:_,pitch:k})]})}function f({image:h,pitch:_}){let k=xr(h).pixels;return l("table",{class:"plan-stats",children:[l("thead",{children:l("tr",{children:l("th",{colSpan:4,class:"top-header",children:"Statistics"})})}),l("tbody",{children:[l("tr",{children:[l("td",{class:"stat-label",rowSpan:3,children:"Size"}),l("td",{class:"stat-value",children:[h.width.toLocaleString(),"\xD7",h.height.toLocaleString(),"px"]})]}),l("tr",{children:l("td",{class:"stat-value",children:[at(h.width*_),"\xD7",at(h.height*_)]})}),l("tr",{children:l("td",{class:"stat-value",children:[y(h.width*_/10),"\xD7",y(h.height*_/10),"cm"]})}),l("tr",{children:[l("td",{class:"stat-label",children:"Pixels"}),l("td",{colSpan:4,class:"stat-value",children:k.toLocaleString()})]}),l("tr",{children:[l("td",{class:"stat-label",children:"Cost (USD)"}),l("td",{colSpan:4,class:"stat-value",children:fr(k*.002)})]}),l("tr",{children:[l("td",{class:"stat-label",children:"Time"}),l("td",{colSpan:4,class:"stat-value",children:mr(k*4)})]})]})]});function y(D){return D.toFixed(1)}}function g(h){return l("div",{class:"settings-row",children:[l("h1",{children:"Plan"}),l("div",{class:"options-row",children:[l("div",{class:"options-group",children:[l("span",{class:"header",children:"Legend"}),b(h,"display","planStyle",ye.planStyle)]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Grid"}),b(h,"display","grid",ye.grid),C(h,"display","nudgeGrid","Nudge Grid")]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Background"}),b(h,"display","background",ye.background)]}),l("div",{class:"options-group",children:[l("span",{class:"header",children:"Comparison"}),b(h,"display","refobj",ye.refobj)]})]})]})}function m(h){let _=H(null),k=H(null);return K(()=>{let D=k.current;D.addEventListener("dragenter",w=>(w.stopPropagation(),w.preventDefault()),!1),D.addEventListener("dragover",w=>(w.stopPropagation(),w.preventDefault()),!1),D.addEventListener("drop",function(w){w.stopPropagation(),w.preventDefault();let B=w.dataTransfer?.files;if(B)for(let x=0;x<B.length;x++){let A=B[x];if(!A.type.startsWith("image/"))continue;let S=new FileReader;S.onload=F=>{let I=A.name,$=F.target.result;i(I,$)},S.readAsDataURL(A)}},!1)},[]),l("div",{class:"gallery",children:[l("div",{class:"close-button",onClick:()=>a("ui","isUploadOpen",!1),children:"\u2716"}),l("h2",{children:"Pick Image"}),l("div",{ref:k,class:"dropbox",children:[l("label",{for:"upload-image-button",style:"display: inline",class:"download-button-label",children:"Upload"}),l("input",{id:"upload-image-button",style:"display: none;",type:"file",accept:"image/png, image/jpeg",ref:_,onChange:y,value:"Choose..."}),", Paste, or Drag & Drop here"]}),l("h2",{children:"Gallery"}),l("div",{class:"gallery-list-container",children:l(Wt,{...h})})]});function y(){if(!_.current||!_.current.files)return;let D=_.current.files;for(let w=0;w<D.length;w++){let B=D[w],x=new FileReader;x.onload=A=>{i(B.name,A.target.result)},x.readAsDataURL(B)}}}function C(h,_,k,y){return l("label",{children:[l("input",{type:"checkbox",checked:h[k],onChange:D=>{a(_,k,!h[k])}}),y]})}function v(h,_,k,y){return l("div",{class:"slider-caption",children:[l("input",{type:"range",list:"image-ticks",class:"slider",onChange:D,min:"-10",max:"10",step:"1",value:h[k]}),l("span",{children:y})]});function D(w){a(_,k,w.target.value)}}function b(h,_,k,y){return ga(k,(D,w)=>a(_,D,w),h[k],y)}}function ga(e,t,r,n){return l(V,{children:[...n.map(([a,o])=>{return l("label",{children:[l("input",{type:"radio",onChange:i,name:e,value:a,checked:a===r}),o]},a);function i(){t(e,a)}})]})}function fa(e,t){let r=new Image;r.addEventListener("load",()=>{let n=document.createElement("canvas");n.width=r.width,n.height=r.height,n.getContext("2d")?.drawImage(r,0,0),t(Dr(r))}),r.src=e}function Me(e){let t=[];return function(...r){for(let a=0;a<t.length;a++)if(t[a][0].length===r.length){let o=!0;for(let i=0;i<r.length;i++)if(t[a][0][i]!==r[i]){o=!1;break}if(o)return t[a][1]}let n=e.apply(void 0,r);return t.push([r,n]),t.length>20&&t.splice(0,20),n}}var ma=[["Eevee","eevee"],["Mario 3","mario-3"],["Megaman X","megaman_x"],["Earthbound","earthbound"],["Kirby","kirby"],["Mushrom","mushroom"],["Crono","crono"],["Ghost","ghost-smw"],["Mew","mew"],["Caped Mario","mario-cape"],["Link (NES)","link-nes"],["Pac-man Ghost","ghost"],["Link (SNES)","link"],["Mario (NES)","mario-1"],["Gannon","gannon"],["Ken","ken"],["Shyguy","shyguy"],["Squirtle","squirtle"],["Brachiosaur","brachiosaur"],["Sonic","sonic"],["Piranha Plant","smw-plant"]],$r="user-gallery";function Hr(){let e=ma.map(([o,i])=>[o,`./gallery/${i}.png`]),t=window.localStorage.getItem($r);t!==null&&(e=JSON.parse(t));function r(o,i){for(let d=0;d<e.length;d++)if(e[d][1]===i)return;e=[[o,i],...e],window.setTimeout(a,250),window.clarity?.("event","add-user-image")}function n(o){for(let i=0;i<e.length;i++)e[i][1]===o&&(e.splice(i,1),e=[...e])}function a(){window.localStorage.setItem($r,JSON.stringify(e))}return{add:r,remove:n,get current(){return e}}}var Ge=Hr(),Ur={display:{background:"url(#checkPattern)",grid:"auto",nudgeGrid:!0,planStyle:"none",refobj:"none"},image:{brightness:0,contrast:0,saturation:0,flip:!1,mirror:!1,descale:!0,dithering:"auto",transparency:"auto",keepOutline:!1},material:{colorMatch:"ictcp",nodupes:!1,palette:"perler-multimix",size:"perler",matchBlackAndWhite:!0},print:{paperSize:"letter",format:"step-by-step",imageSize:"actual",breakStrategy:"page"},threeD:{format:"3mf",heightScale:1},source:{displayName:Ge.current[0][0],uri:Ge.current[0][1],_decoded:void 0},ui:{isUploadOpen:!1,isPrintOpen:!1,is3dOpen:!1,isWelcomeOpen:!0,showLegend:!1,showSettings:!1,tourStage:void 0,helpTopic:void 0}};window.addEventListener("DOMContentLoaded",function(){let e=window.localStorage.getItem("props"),t;e===null?t=Ur:t=JSON.parse(e);try{pt(t,Ge,document.body)}catch(r){window.localStorage.clear(),console.error(r),t=Ur,pt(t,Ge,document.body)}});})();
/*! Bundled license information:

color-diff/lib/diff.js:
color-diff/lib/convert.js:
color-diff/lib/palette.js:
  (**
   * @author Markus Ekholm
   * @copyright 2012-2016 (c) Markus Ekholm <markus at botten dot org >
   * @license Copyright (c) 2012-2016, Markus Ekholm
   * All rights reserved.
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *    * Redistributions of source code must retain the above copyright
   *      notice, this list of conditions and the following disclaimer.
   *    * Redistributions in binary form must reproduce the above copyright
   *      notice, this list of conditions and the following disclaimer in the
   *      documentation and/or other materials provided with the distribution.
   *    * Neither the name of the author nor the
   *      names of its contributors may be used to endorse or promote products
   *      derived from this software without specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL MARKUS EKHOLM BE LIABLE FOR ANY
   * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
   * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
