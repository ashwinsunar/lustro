import{d5 as q,u as z,d as W,l as B,r as l,aS as V,j as e,X,C as Y,fs as D,bp as M,aT as _}from"./index-gOSp1NwJ.js";import{g as k}from"./componentCenteringUtils-D5WdjxUy.js";import{M as J}from"./minus-DqtZuuR_.js";import{M as K}from"./maximize-2-DifekMQh.js";import{L as I}from"./lock-Bm0wiGkX.js";import{P as Q}from"./pause-Y4Ln2IlZ.js";import{P as Z}from"./play-BvfTj9Ur.js";import{C as ee}from"./copy-BNGOpyk6.js";import{h as te}from"./prism-DusaS31Z.js";import{v as re}from"./vsc-dark-plus-CcVsXCy1.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=q("SquareArrowUpRight",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M8 8h8v8",key:"b65dnt"}],["path",{d:"m8 16 8-8",key:"13b9ih"}]]),ne=r=>{var f;if(!r)return"";const d='<script src="https://cdn.tailwindcss.com"><\/script>',u=`
    <style>
      /* Disable animations */
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
        animation: none !important;
      }
      
      /* Disable CSS transforms that might be animated */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Override opacity-0 class during preview to keep elements visible */
      .opacity-0 {
        opacity: 1 !important;
      }
      
      /* Disable classes with "animate" in their name */
      [class*="animate"] {
        animation: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        animation-fill-mode: none !important;
        opacity: 1 !important;
        filter: none !important;
        -webkit-filter: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      
      /* Hide Spline embeds */
      spline-viewer,
      [data-spline],
      iframe[src*="spline.design"],
      iframe[src*="my.spline.design"],
      embed[src*="spline.design"],
      embed[src*="my.spline.design"],
      object[data*="spline.design"],
      object[data*="my.spline.design"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Hide canvas elements that might be used for threejs */
      canvas:not([data-allow-canvas]) {
        display: none !important;
        visibility: hidden !important;
      }
    </style>
    <script>
      (function() {
        // Disable requestAnimationFrame
        window.requestAnimationFrame = function(callback) {
          return -1;
        };
        
        // Disable setTimeout for short intervals (likely animations)
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay) {
          if (delay < 100) {
            // Return a valid timer ID but don't execute the callback
            return originalSetTimeout.call(this, function() {}, delay);
          }
          return originalSetTimeout.apply(this, arguments);
        };
        
        // Disable setInterval (likely animations)
        const originalSetInterval = window.setInterval;
        window.setInterval = function(callback, delay) {
          // Return a valid timer ID but don't execute the callback
          return originalSetInterval.call(this, function() {}, delay);
        };
        
        // Disable canvas rendering
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
          // Allow canvas if explicitly marked as allowed
          if (this.hasAttribute('data-allow-canvas')) {
            return originalGetContext.call(this, contextType, contextAttributes);
          }
          
          const context = originalGetContext.call(this, contextType, contextAttributes);
          if (!context) return context;
          
          // For 2D context, override drawing methods
          if (contextType === '2d') {
            const drawingMethods = [
              'clearRect', 'fillRect', 'strokeRect', 'fillText', 'strokeText',
              'drawImage', 'putImageData', 'fill', 'stroke', 'arc', 'arcTo',
              'beginPath', 'closePath', 'lineTo', 'moveTo', 'quadraticCurveTo',
              'bezierCurveTo', 'rect', 'ellipse'
            ];
            
            drawingMethods.forEach(method => {
              if (typeof context[method] === 'function') {
                context[method] = function() {
                  return this;
                };
              }
            });
          }
          
          // For WebGL context, override key methods
          else if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
            const webglMethods = [
              'clear', 'drawArrays', 'drawElements', 'useProgram', 'bindBuffer',
              'bindTexture', 'bindFramebuffer', 'viewport', 'enable', 'disable'
            ];
            
            webglMethods.forEach(method => {
              if (typeof context[method] === 'function') {
                context[method] = function() {
                  return this;
                };
              }
            });
          }
          
          return context;
        };
        
        // Disable Three.js specific functionality
        setTimeout(() => {
          if (typeof THREE !== 'undefined') {
            if (THREE.WebGLRenderer) {
              THREE.WebGLRenderer.prototype.render = function() {
                return this;
              };
            }
            
            if (THREE.AnimationMixer) {
              THREE.AnimationMixer.prototype.update = function() {
                return this;
              };
            }
          }
        }, 100);
        
        // Disable Spline functionality
        const hideSplineElements = () => {
          const splineSelectors = [
            'spline-viewer',
            '[data-spline]',
            'iframe[src*="spline.design"]',
            'iframe[src*="my.spline.design"]',
            'embed[src*="spline.design"]',
            'embed[src*="my.spline.design"]',
            'object[data*="spline.design"]',
            'object[data*="my.spline.design"]'
          ];
          
          splineSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            });
          });
        };
        
        hideSplineElements();
        
        // Monitor for new spline elements being added
        if (document.body instanceof Node) {
          const observer = new MutationObserver(hideSplineElements);
          observer.observe(document.body, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data']
          });
        }
        
        // Disable Spline runtime
        if (typeof window.Spline !== 'undefined') {
          window.Spline = function() {
            return {
              load: () => Promise.resolve(),
              setSize: () => {},
              dispose: () => {},
              play: () => {},
              pause: () => {},
              stop: () => {}
            };
          };
        }
        
        Object.defineProperty(window, 'Spline', {
          set: function(value) {
            window._SplineOriginal = value;
          },
          get: function() {
            return function() {
              return {
                load: () => Promise.resolve(),
                setSize: () => {},
                dispose: () => {},
                play: () => {},
                pause: () => {},
                stop: () => {}
              };
            };
          },
          configurable: true
        });
      })();
    <\/script>
  `;if(r.toLowerCase().includes("<html")&&r.toLowerCase().includes("<head")&&r.toLowerCase().includes("<body")){let o=r;const i=[];r.includes("fonts.googleapis.com")||(i.push('<link rel="preconnect" href="https://fonts.googleapis.com">'),i.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'),i.push('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">')),r.includes("https://cdn.tailwindcss.com")||i.push(d),r.includes("lucide")||i.push('<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"><\/script>'),(!r.includes("font-family")||!r.includes("Inter"))&&i.push(`<style>
      body { font-family: 'Inter', sans-serif; }
    </style>`);const b=[...i,u];if(b.length>0){const s=b.join(`
  `);o.toLowerCase().includes("</head>")?o=o.replace(/(<\/head>)/i,`  ${s}
$1`):o.toLowerCase().includes("<head>")&&(o=o.replace(/(<head[^>]*>)/i,`$1
  ${s}`))}if(o.toLowerCase().includes("<body")){const s=o.match(/<body[^>]*>([\s\S]*)<\/body>/i);if(s){const g=s[1],x=((f=s[0].match(/<body[^>]*>/i))==null?void 0:f[0])||"<body>";o.toLowerCase().includes("</head>")&&(o=o.replace(/(<\/head>)/i,`
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      .component-wrapper {
        width: 100%;
        height: 100%;
        padding: 0;
        box-sizing: border-box;
        overflow: auto;
      }
    </style>
$1`)),o=o.replace(/<body[^>]*>([\s\S]*)<\/body>/i,`${x}
    <div class="component-wrapper">
      ${g}
    </div>
    ${k()}
  </body>`)}}return o}return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${`
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  ${d}
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body { font-family: 'Inter', sans-serif; }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>`}
  ${u}
  <title>Preview</title>
</head>
<body>
  <div class="component-wrapper">
  ${r}
  </div>
  ${k()}
</body>
</html>`},ge=({rawHtmlContent:r,onPromoteToMainPreview:d,height:u="240px",startHidden:m=!1,defaultEffectsEnabled:f=!1,zoom:o=.5,backgroundColor:i="white",centerContent:b=!1,defaultView:s="preview",premium:g=!1})=>{const{userTier:x}=z(),{toast:y}=W(),j=B(),C=l.useRef(null),T=V(C,{root:null,rootMargin:"200px 0px 200px 0px",threshold:.01}),[c,w]=l.useState(s),[S,h]=l.useState(m),[R,N]=l.useState(!1),[p,A]=l.useState(f);l.useEffect(()=>{w(s)},[s]),l.useEffect(()=>{h(m)},[m]);const F=_.isProUser(x),t=g&&!F,H=()=>{if(t){D(y,j,"copy");return}navigator.clipboard.writeText(r),N(!0),setTimeout(()=>N(!1),2e3)},$=()=>{if(t){D(y,j,"view");return}d&&d(M(r))},U=()=>{A(!p)},G=!S&&c==="preview"&&T&&!t?(()=>{var E;if(c!=="preview")return"";try{let n=r.length>5e5?r:p?M(r):ne(r);if(n.toLowerCase().includes("<body")){const v=n.match(/<body[^>]*>([\s\S]*)<\/body>/i);if(v){let a=v[1];const O=((E=v[0].match(/<body[^>]*>/i))==null?void 0:E[0])||"<body>",L=`
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .component-wrapper {
          width: 100%;
          height: 100%;
          padding: 0;
          box-sizing: border-box;
          overflow: auto;
        }
      </style>`;n.includes(".component-wrapper")||(n.toLowerCase().includes("</head>")?n=n.replace(/(<\/head>)/i,`${L}
$1`):n.toLowerCase().includes("<head>")&&(n=n.replace(/(<head[^>]*>)/i,`$1
${L}`))),!a.includes('class="component-wrapper"')&&!a.includes("class='component-wrapper'")&&(a=`<div class="component-wrapper">${a}</div>`),!a.includes("getComponentCenteringScript")&&!a.includes("checkAndCenter")&&(a=`${a}
    ${k()}`),n=n.replace(/<body[^>]*>([\s\S]*)<\/body>/i,`${O}
      ${a}
    </body>`)}}return n}catch(P){return console.warn("Failed to prepare HTML for preview, using raw content:",P),r}})():"";return e.jsxs("div",{ref:C,className:"my-2 rounded-md overflow-hidden border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900",children:[e.jsxs("div",{className:"flex items-center justify-between p-1 px-1 bg-neutral-50 dark:bg-neutral-800/80 border-b border-border/50 text-xs",children:[e.jsxs("div",{className:"flex items-center space-x-1.5 pl-1.5",children:[e.jsx("span",{className:"block w-2.5 h-2.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-red-400 rounded-full transition-colors relative group cursor-pointer",onClick:()=>h(!0),children:e.jsx(X,{className:"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 opacity-0 group-hover:opacity-100 text-white",strokeWidth:3})}),e.jsx("span",{className:"block w-2.5 h-2.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-yellow-400 rounded-full transition-colors relative group cursor-pointer",onClick:()=>h(!0),children:e.jsx(J,{className:"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 opacity-0 group-hover:opacity-100 text-white",strokeWidth:3})}),e.jsx("span",{className:`block w-2.5 h-2.5 bg-neutral-300 dark:bg-neutral-700 rounded-full transition-colors relative group ${t?"cursor-not-allowed opacity-50":"hover:bg-green-400 cursor-pointer"}`,onClick:$,children:e.jsx(K,{className:"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 opacity-0 group-hover:opacity-100 text-white",strokeWidth:3})}),e.jsxs("div",{className:"flex items-center space-x-1",children:[d&&e.jsx(e.Fragment,{children:e.jsxs("button",{onClick:$,title:t?"Pro content - Upgrade to view":"Show in main preview",disabled:t,className:`flex gap-1 items-center ml-1 p-0 px-1 rounded border text-[10px] font-medium ${t?"cursor-not-allowed opacity-50 border-neutral-200 dark:border-neutral-700 text-neutral-400":"hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-500"}`,children:[t?e.jsx(I,{className:"h-2.5 w-2.5 text-muted-foreground opacity-50"}):e.jsx(oe,{className:"h-2.5 w-2.5 text-muted-foreground opacity-50"}),t?"Locked":"View"]})}),e.jsx("button",{onClick:U,disabled:t,title:t?"Pro content - Upgrade to toggle effects":p?"Disable animations & effects":"Enable animations & effects",className:`flex gap-1 items-center p-0 px-1 rounded border text-[10px] font-medium transition-colors h-[18px] ${t?"cursor-not-allowed opacity-50 border-neutral-200 dark:border-neutral-700 text-neutral-400":p?"text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30":"text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"}`,children:p?e.jsx(Q,{className:"h-2.5 w-2.5 opacity-50"}):e.jsx(Z,{className:"h-2.5 w-2.5 opacity-50"})})]})]}),e.jsxs("div",{className:"flex items-center space-x-1",children:[e.jsxs("button",{onClick:H,disabled:t,className:`flex gap-1 items-center ml-1 p-0 px-1 rounded border text-[10px] font-medium ${t?"cursor-not-allowed opacity-50 border-neutral-200 dark:border-neutral-700 text-neutral-400":"hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-500"}`,title:t?"Pro content - Upgrade to copy":"Copy code to clipboard",children:[t?e.jsx(I,{className:"h-2.5 w-2.5 text-muted-foreground opacity-50"}):R?e.jsx(Y,{className:"h-2.5 w-2.5 text-muted-foreground opacity-50"}):e.jsx(ee,{className:"h-2.5 w-2.5 text-muted-foreground opacity-50"}),t?"Locked":"Copy"]}),e.jsxs("div",{className:"flex items-center bg-neutral-200/70 dark:bg-neutral-700/70 rounded-md p-[0.5px] border border-border/60",children:[e.jsx("button",{onClick:()=>{t||w("preview")},disabled:t,className:`px-2 py-0 text-[9px] font-medium rounded-[4px] transition-all ${t?"cursor-not-allowed opacity-50":c==="preview"?"bg-white dark:bg-neutral-600 text-primary shadow-sm":"text-muted-foreground hover:text-foreground"}`,children:"Preview"}),e.jsx("button",{onClick:()=>{t||w("code")},disabled:t,className:`px-2 py-0 text-[9px] font-medium rounded-[4px] transition-all ${t?"cursor-not-allowed opacity-50":c==="code"?"bg-white dark:bg-neutral-600 text-primary shadow-sm":"text-muted-foreground hover:text-foreground"}`,children:"Code"})]})]})]}),S?e.jsx("div",{className:"h-[30px] flex items-center justify-center",children:e.jsx("button",{onClick:()=>h(!1),className:"text-[10px] text-muted-foreground hover:text-foreground",children:"Click to show content"})}):e.jsx("div",{className:"overflow-auto",style:{height:u},children:T?c==="code"?e.jsx(te,{language:"html",style:re,customStyle:{margin:0,fontSize:"11px",fontFamily:"Geist Mono, monospace",backgroundColor:"var(--syntax-bg)",color:"var(--syntax-color)",padding:"10px",lineHeight:"1.4"},codeTagProps:{style:{fontFamily:"Geist Mono, monospace"}},className:"w-full",children:r}):e.jsx("div",{className:"w-full h-full overflow-hidden",style:{backgroundColor:i},children:e.jsx("iframe",{srcDoc:G,title:"Embedded HTML Preview",style:{width:`${100/o}%`,height:`${100/o}%`,transform:`scale(${o})`,transformOrigin:"top left",border:"none",backgroundColor:i},sandbox:"allow-scripts allow-forms allow-popups allow-modals"})}):e.jsx("div",{className:"w-full h-full flex items-center justify-center text-[10px] text-muted-foreground bg-neutral-50 dark:bg-neutral-900/60",children:"Code preview paused (off-screen)"})})]})};export{ge as C,oe as S};
