"use strict";(self.webpackChunkapp=self.webpackChunkapp||[]).push([[3119],{3119:(et,A,c)=>{c.r(A),c.d(A,{ViewAllPageModule:()=>tt});var w=c(177),S=c(9417),v=c(8974),D=c(3021),u=c(467),g=c(56),j=c(4715),x=c(4733),R=c(1471),T=c(2849),G=c(9441),B=c(8666),U=c(7420),$=c(5318),V=c.n($),Y=c(1129),E=c(8113),t=c(4438),F=c(444),I=c(2904),X=c(7803),N=c(4517),L=c(5402);const z=a=>({"createList-cards":a});function W(a,m){if(1&a&&(t.j41(0,"div",11),t.EFF(1),t.k0s()),2&a){const l=t.XpG().$implicit;t.R7$(),t.JRh(null==l||null==l.metaData?null:l.metaData.name)}}function J(a,m){if(1&a){const l=t.RV6();t.j41(0,"div",12),t.bIt("click",function(){t.eBV(l);const n=t.XpG().$implicit,o=t.XpG();return t.Njj(o.openModal(n))}),t.nrm(1,"ion-icon",13),t.k0s()}}function H(a,m){if(1&a){const l=t.RV6();t.j41(0,"div")(1,"ion-checkbox",14),t.bIt("ionChange",function(n){t.eBV(l);const o=t.XpG().index,r=t.XpG();return t.Njj(r.isContentSelect(n,o))}),t.k0s()()}if(2&a){const l=t.XpG().$implicit;t.R7$(),t.Y8G("checked",l.isSelected)}}function Q(a,m){if(1&a){const l=t.RV6();t.j41(0,"div",4),t.bIt("click",function(){const n=t.eBV(l).$implicit,o=t.XpG();return t.Njj(o.playcontent(n))}),t.j41(1,"div",5),t.nrm(2,"img",6),t.k0s(),t.j41(3,"div",7),t.DNE(4,W,2,1,"div",8)(5,J,2,0,"div",9)(6,H,2,1,"div",10),t.k0s()()}if(2&a){const l=m.$implicit,e=t.XpG();t.R7$(2),t.Y8G("src",null==l||null==l.metaData?null:l.metaData.thumbnail,t.B4B),t.R7$(2),t.Y8G("ngIf",null==l||null==l.metaData?null:l.metaData.name),t.R7$(),t.Y8G("ngIf","recentlyviewed"===e.type),t.R7$(),t.Y8G("ngIf","playlist"===e.type)}}function Z(a,m){if(1&a){const l=t.RV6();t.j41(0,"div",15)(1,"div",16)(2,"div",17)(3,"div",18),t.EFF(4),t.k0s(),t.nrm(5,"ion-icon",19),t.k0s(),t.j41(6,"div",20),t.bIt("click",function(){t.eBV(l);const n=t.XpG();return t.Njj(n.uploadLocalContents())}),t.nrm(7,"ion-icon",21),t.k0s(),t.j41(8,"div",22)(9,"ion-button",23),t.bIt("click",function(){t.eBV(l);const n=t.XpG();return t.Njj(n.createList())}),t.EFF(10),t.nI1(11,"translate"),t.k0s()()()()}if(2&a){const l=t.XpG();t.R7$(4),t.JRh(l.selectedContents.length),t.R7$(5),t.Y8G("disabled",!l.selectedContents.length),t.R7$(),t.SpI(" ",t.bMT(11,3,"createPlaylist")," ")}}const K=[{path:"",component:(()=>{var a;class m{constructor(e,n,o,r,s,h,p,d){var P;this.contentService=e,this.router=n,this.headerService=o,this.playListService=r,this.platform=s,this.location=h,this.modalCtrl=p,this.utilService=d,this.contentList=[],this.type="",this.playlists=[],this.selectedContents=[],this.optModalOpen=!1,this.resolveNativePath=y=>new Promise((M,_)=>{window.FilePath.resolveNativePath(y,M,b=>{console.error(`${y} could not be resolved by the plugin: ${b.message}`),_(b)})}),this.navigated=!1;let f=null===(P=this.router.getCurrentNavigation())||void 0===P?void 0:P.extras;var O;f&&(this.type=null===(O=f.state)||void 0===O?void 0:O.type)}ngOnInit(){var e=this;return(0,u.A)(function*(){e.platform.backButton.subscribeWithPriority(11,(0,u.A)(function*(){e.location.back(),e.headerService.deviceBackBtnEvent({name:"backBtn"})})),e.headerService.headerEventEmitted$.subscribe(n=>{"back"===n&&!e.navigated&&(e.navigated=!0,e.location.back())}),e.getRecentlyviewedContent()})()}getPlaylistContent(){var e=this;return(0,u.A)(function*(){yield e.playListService.getAllPlayLists("guest").then(n=>{n&&(e.playlists=n)}).catch(n=>{console.log("error",n)})})()}getRecentlyviewedContent(){var e=this;return(0,u.A)(function*(){yield e.contentService.getRecentlyViewedContent("guest").then(n=>{let o={};n.filter(r=>!o[r.contentIdentifier]&&(o[r.contentIdentifier]=!0,e.contentList.push(r),!0)),e.contentList.map(r=>r.metaData="string"==typeof r.metaData?JSON.parse(r.metaData):r.metaData),e.contentList=e.getContentImgPath(e.contentList)}).catch(n=>{console.log("error",n)})})()}ngOnDestroy(){var e=this;return(0,u.A)(function*(){const n=yield e.modalCtrl.getTop();n&&n.dismiss()})()}createList(){let e=[];this.contentList.forEach(n=>{n.isSelected&&e.push(n)}),console.log("...................",e),this.router.navigate(["/create-playlist"],{state:{selectedContents:e}})}deletePlaylist(){var e=this;return(0,u.A)(function*(){yield e.playListService.deletePlayList(e.deleteContent.identifier).then(n=>{e.getPlaylistContent()}).catch(n=>{console.log("err",n)})})()}ionViewWillEnter(){this.navigated=!1,"recentlyviewed"===this.type?this.headerService.showHeader("Recently Viewed",!0):"playlist"===this.type&&this.headerService.showHeader("Select from Recently Viewed",!0),this.getPlaylistContent()}openModal(e){var n=this;return(0,u.A)(function*(){let o;n.optModalOpen||(n.optModalOpen=!0,o=yield n.modalCtrl.create({component:T.q,componentProps:{content:e},cssClass:"sheet-modal",breakpoints:[.25],showBackdrop:!1,initialBreakpoint:.25,handle:!1,handleBehavior:"none"}),yield o.present()),o.onDidDismiss().then(function(){var r=(0,u.A)(function*(s){n.optModalOpen=!1,s.data&&"addToPitara"===s.data.type?n.addContentToMyPitara(s.data.content||e):s.data&&"like"==s.data.type&&(n.contentService.likeContent(s.data.content||e,"guest",!0),s.data.content.metaData.isLiked&&(yield B.Q.play({assetId:"windchime"}),(0,U.A)({startVelocity:30,particleCount:400,spread:360,ticks:60,origin:{y:.5,x:.5},colors:["#a864fd","#29cdff","#78ff44","#ff718d","#fdff6a"]})))});return function(s){return r.apply(this,arguments)}}())})()}addContentToMyPitara(e){var n=this;return(0,u.A)(function*(){const o=yield n.modalCtrl.create({component:G.$,componentProps:{content:e},cssClass:"add-to-pitara",breakpoints:[0,1],showBackdrop:!1,initialBreakpoint:1,handle:!1,handleBehavior:"none"});yield o.present(),o.onWillDismiss().then(r=>{})})()}isContentSelect(e,n){this.contentList[n].isSelected=e.detail.checked,this.checkSelectedContent()}checkSelectedContent(){this.selectedContents=[],this.contentList.forEach(e=>{e.isSelected&&this.selectedContents.push(e)})}openFilePicker(){var e=this;return(0,u.A)(function*(){let n=[g.z5.PDF];n=n.concat(g.z5.VIDEOS).concat(g.z5.AUDIO);const{files:o}=yield j.N.pickFiles({types:n,multiple:!0,readData:!1});let r=[];const s=yield e.utilService.getLoader();yield s.present();for(let h=0;h<o.length;h++){const p=yield e.resolveNativePath(o[h].path);console.log("path",p);const d=p.substring(p.lastIndexOf("/")+1);r.push({source:"local",sourceType:"local",metaData:{identifier:(0,R.SHA1)(p).toString(),url:p,name:d,mimetype:x.O.getMimeType(d),thumbnail:""}})}yield s.dismiss(),r.length&&(r=e.getContentImgPath(r,!0),e.contentList=r.concat(e.contentList))})()}getContentImgPath(e,n){return e.forEach(o=>{var r;o.metaData.thumbnail=o.metaData.mimetype===g.Cc.YOUTUBE?o.metaData.thumbnail:!o.metaData.thumbnail||null!=o&&null!==(r=o.metaData.identifier)&&void 0!==r&&r.startsWith("do_")?x.O.getImagePath(o.metaData.mimetype||o.metaData.mimeType):o.mediaData.thumbnail,n&&(o.isSelected=!0,this.selectedContents.push(o))}),e}loadYoutubeImg(e){let n=e.identifier;return n&&n.startsWith("do_")&&(n=V()(e.url)),`https://img.youtube.com/vi/${n}/mqdefault.jpg`}playcontent(e){var n=this;return(0,u.A)(function*(){"recentlyviewed"===n.type&&!n.optModalOpen&&(yield n.router.navigate(["/player"],{state:{content:e}}))})()}uploadLocalContents(){var e=this;return(0,u.A)(function*(){let n;e.optModalOpen||(e.optModalOpen=!0,n=yield e.modalCtrl.create({component:Y.W,componentProps:{uploadType:[{type:"url",label:"Upload from Youtube"},{type:"diksha",label:"Upload from Diksha"}]},cssClass:"sheet-modal",breakpoints:[.25],showBackdrop:!1,initialBreakpoint:.25,handle:!1,handleBehavior:"none"}),yield n.present()),n.onDidDismiss().then(function(){var o=(0,u.A)(function*(r){e.optModalOpen=!1,"file"===r.data.type?e.openFilePicker():e.createYoutubeContent(r.data.type)});return function(r){return o.apply(this,arguments)}}())})()}createYoutubeContent(e){var n=this;return(0,u.A)(function*(){const o=yield n.modalCtrl.create({component:E.r,componentProps:{title:"url"==e?"Add Youtube URL":"Add Diksha URL",placeholder:"Name"},cssClass:"auto-height"});yield o.present(),o.onDidDismiss().then(function(){var r=(0,u.A)(function*(s){var h;let p=null===(h=s.data)||void 0===h?void 0:h.url;if(s&&"create"===s.data.type){let d=[];const P=yield n.utilService.getLoader();yield P.present();let f="";if("url"===e)f=V()(p),d.push({source:"local",sourceType:"local",metaData:{identifier:f,url:"https://www.youtube.com/watch?v="+f,name:s.data.name,mimetype:g.z5.YOUTUBE,thumbnail:""}}),d=n.getContentImgPath(d,!0),n.contentList=d.concat(n.contentList);else if("diksha"===e){f=p.split("/").filter(y=>y.startsWith("do_"));try{yield n.contentService.readDikshaContents(f[0]).then(function(){var y=(0,u.A)(function*(M){var _,b;console.log("res ",M);let i=null===(_=M.body)||void 0===_||null===(_=_.result)||void 0===_?void 0:_.content;if((null===(b=i.dialcodes)||void 0===b?void 0:b.length)>0)yield n.contentService.getContents(i.dialcodes[0]).then(C=>{console.log("content data ",C),C.length>0&&(C.forEach(k=>{k.source="local",(k.metaData.mimetype==g.z5.PDF||k.metaData.mimetype==g.z5.VIDEO)&&d.push(k)}),d=n.getContentImgPath(d,!0),n.contentList=d.concat(n.contentList))});else if(i.mediaType="content"){let C={source:"local",sourceType:"diksha",metaData:{identifier:null==i?void 0:i.identifier,name:null==i?void 0:i.name,thumbnail:null==i?void 0:i.thumbnail,description:null==i?void 0:i.name,mimetype:(null==i?void 0:i.mimetype)||(null==i?void 0:i.mimeType),url:null==i?void 0:i.streamingUrl,focus:null==i?void 0:i.focus,keyword:null==i?void 0:i.keyword,domain:null==i?void 0:i.domain,curriculargoal:null==i?void 0:i.curriculargoal,competencies:null==i?void 0:i.competencies,language:null==i?void 0:i.language,category:null==i?void 0:i.category,audience:null==i?void 0:i.audience,status:null==i?void 0:i.status,createdon:null==i?void 0:i.createdOn,lastupdatedon:(null==i?void 0:i.lastupdatedon)||(null==i?void 0:i.lastUpdatedOn),artifactUrl:null==i?void 0:i.artifactUrl}};(C.metaData.mimetype==g.z5.PDF||C.metaData.mimetype==g.z5.VIDEO)&&(d.push(C),d=n.getContentImgPath(d,!0),n.contentList=d.concat(n.contentList))}});return function(M){return y.apply(this,arguments)}}())}catch(y){console.log("server err ",y)}}yield P.dismiss()}});return function(s){return r.apply(this,arguments)}}())})()}}return(a=m).\u0275fac=function(e){return new(e||a)(t.rXU(F.f),t.rXU(D.Ix),t.rXU(I.Ux),t.rXU(X.q),t.rXU(N.OD),t.rXU(w.aZ),t.rXU(v.W3),t.rXU(I.a0))},a.\u0275cmp=t.VBU({type:a,selectors:[["app-view-all"]],viewQuery:function(e,n){if(1&e&&t.GBs(v.Sb,5),2&e){let o;t.mGM(o=t.lsd())&&(n.modal=o.first)}},decls:4,vars:6,consts:[[3,"fullscreen"],[1,"cards-container",3,"ngClass"],["class","card",3,"click",4,"ngFor","ngForOf"],["class","view-all-btn",4,"ngIf"],[1,"card",3,"click"],[1,"card__img"],["alt","Playlist Image",3,"src"],[1,"card__metadata"],["class","card__title",4,"ngIf"],[3,"click",4,"ngIf"],[4,"ngIf"],[1,"card__title"],[3,"click"],["slot","end","aria-hidden","true","src","../../../assets/icon/kabab-icon.svg"],[1,"playlist-card__checkbox",3,"ionChange","checked"],[1,"view-all-btn"],[1,"view-playlist"],[1,"view-playlist__icon"],[1,"count"],["aria-hidden","true","src","assets/icon/pitara-blue.svg"],[1,"view-playlist__icon",3,"click"],["aria-hidden","true","src","assets/icon/file-upload.svg"],[1,"view-playlist__button"],["fill","outline",1,"new-playlist__btn",3,"click","disabled"]],template:function(e,n){1&e&&(t.j41(0,"ion-content",0)(1,"div",1),t.DNE(2,Q,7,4,"div",2),t.k0s()(),t.DNE(3,Z,12,5,"div",3)),2&e&&(t.Y8G("fullscreen",!0),t.R7$(),t.Y8G("ngClass",t.eq3(4,z,"playlist"===n.type)),t.R7$(),t.Y8G("ngForOf",n.contentList),t.R7$(),t.Y8G("ngIf","playlist"===n.type))},dependencies:[w.YU,w.Sq,w.bT,v.Jm,v.eY,v.W9,v.iq,v.hB,L.D9],styles:[".cards-container[_ngcontent-%COMP%]{padding:.2rem 1rem}.cards-container[_ngcontent-%COMP%]   .bot-section[_ngcontent-%COMP%]{display:flex;justify-content:space-between;padding:0 1rem 1rem}.cards-container[_ngcontent-%COMP%]   .bot-section[_ngcontent-%COMP%]   .image[_ngcontent-%COMP%]{position:relative}.cards-container[_ngcontent-%COMP%]   .bot-section[_ngcontent-%COMP%]   .image[_ngcontent-%COMP%]   .image-title[_ngcontent-%COMP%]{position:absolute;bottom:.625rem;color:var(--ion-color-primary-contrast);left:0;right:0;text-align:center}.card[_ngcontent-%COMP%]{position:relative;padding-bottom:1rem}.card__img[_ngcontent-%COMP%]{height:194px;width:100%;overflow:hidden}.card__img[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{max-width:100%;width:100%;height:100%;border-radius:1rem}.card__metadata[_ngcontent-%COMP%]{padding-top:.5rem;display:flex;align-items:center;justify-content:space-between}.card__metadata[_ngcontent-%COMP%]   ion-icon[_ngcontent-%COMP%]{height:1.75rem;width:1.75rem}.card__action-btns[_ngcontent-%COMP%]{display:flex;align-items:center}.card__action-btns[_ngcontent-%COMP%]   ion-icon[_ngcontent-%COMP%]{width:1.5rem;height:1.5rem;margin-right:1rem}.card__action-btns[_ngcontent-%COMP%]   ion-icon[_ngcontent-%COMP%]:last-child{margin-left:auto;margin-right:0}.card__title[_ngcontent-%COMP%]{font-size:.75rem;font-weight:400;width:90%;text-transform:capitalize;word-break:break-word;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.no-data[_ngcontent-%COMP%]{text-align:center}.cards-container[_ngcontent-%COMP%]{padding-top:.5rem}.card[_ngcontent-%COMP%]{display:flex}.card__img[_ngcontent-%COMP%]{width:100%;height:4.5rem;max-width:7.5rem}.card__img[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{border-radius:.5rem}.card__metadata[_ngcontent-%COMP%]{padding-top:0;padding-left:.5rem;align-items:flex-start;width:100%}.view-playlist[_ngcontent-%COMP%]{position:fixed;bottom:.188rem;width:98%;height:4rem;background-color:var(--ion-color-secondary);border-radius:3.125rem;display:flex;align-items:center;padding:.5rem}.view-playlist__icon[_ngcontent-%COMP%]{width:3rem;height:3rem;background-color:var(--ion-color-primary-contrast);border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;margin-right:5%}.view-playlist__icon[_ngcontent-%COMP%]   .count[_ngcontent-%COMP%]{position:absolute;top:-.188rem;right:-.188rem;background:var(--ion-color-primary);border-radius:50%;font-size:.625rem;width:1.125rem;height:1.125rem;display:flex;align-items:center;justify-content:center;color:var(--ion-color-primary-contrast)}.view-playlist__icon[_ngcontent-%COMP%]   ion-icon[_ngcontent-%COMP%]{width:1.5rem;height:1.5rem}.view-playlist__button[_ngcontent-%COMP%]{margin-left:auto}.view-playlist__button[_ngcontent-%COMP%]   ion-button[_ngcontent-%COMP%]{font-size:.75rem;font-weight:700}.view-all-btn[_ngcontent-%COMP%]{display:flex;justify-content:center}[_nghost-%COMP%]   ion-checkbox[_ngcontent-%COMP%]{--border-radius: 50% !important;--border-color: var(--ion-color-medium) !important;--size: 1.5rem !important;--checkbox-background-checked: var(--ion-color-secondary) !important;--border-color-checked: var(--ion-color-secondary) !important;margin:0}[_nghost-%COMP%]   ion-button.new-playlist__btn[_ngcontent-%COMP%]{--background: var(--ion-color-secondary);--color: var(--ion-color-primary-contrast);--border-radius: 1.875rem;--border-color: var(--ion-color-primary-contrast);--border-style: solid;--border-width: 1px;--box-shadow: none}ion-content[_ngcontent-%COMP%]{--padding-top: 3.2rem}.createList-cards[_ngcontent-%COMP%]{height:calc(100vh - 120px);overflow:auto}"]}),m})()}];let q=(()=>{var a;class m{}return(a=m).\u0275fac=function(e){return new(e||a)},a.\u0275mod=t.$C({type:a}),a.\u0275inj=t.G2t({imports:[D.iI.forChild(K),D.iI]}),m})(),tt=(()=>{var a;class m{}return(a=m).\u0275fac=function(e){return new(e||a)},a.\u0275mod=t.$C({type:a}),a.\u0275inj=t.G2t({imports:[w.MD,S.YN,v.bv,q,L.h]}),m})()}}]);