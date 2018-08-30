define([
	"dojo/_base/declare", "esri/tasks/query", "esri/tasks/QueryTask", "esri/graphicsUtils"
],
function ( declare, Query, QueryTask, graphicsUtils ) {
        "use strict";

        return declare(null, {
			eventListeners: function(t){
				$("#" + t.id + "prj-sym-wrap input").click(function(c){
					t.obj.lyrNum = c.currentTarget.value;
					t.obj.visibleLayers = [t.obj.lyrNum];
					t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
				});
				$("#" + t.id + "add-sel-group-btn").click(function(){
					t.clicks.addChosenGroup(t);	
				})
				$("#" + t.id + "prj-info-wrap input").click(function(c){
					$(".infoTabWrap").hide();
					$("." + c.currentTarget.value).show();
				})
			},
			addChosenGroup: function(t){
				t.chCnt = t.chCnt + 1
				var cnt = $(".sel-group-wrap").children().length;
				if (cnt > 0){
					var andOr = '<div class="andOrRadio"><label class="form-component" for="optionA' + t.chCnt + '">' + 
									'<input checked type="radio" id="optionA' + t.chCnt + '" value="AND" name="andOr' + t.chCnt + '">' +
									'<div class="check"></div>' + 
									'<span class="form-text">And</span>' +
								'</label>' +
								'<label class="form-component" for="optionB' + t.chCnt + '">' + 
									'<input type="radio" id="optionB' + t.chCnt + '" value="OR" name="andOr' + t.chCnt + '">' +
									'<div class="check"></div>' + 
									'<span class="form-text">Or</span>' +
								'</label></div>'
					$(".sel-group-wrap").append(andOr)
				}
				$("#" + t.id + "add-wrap").hide();
				if (cnt == 0){
					$(".sel-group-wrap").append(t.selGroup1);
				}else{
					$(".sel-group-wrap").append(t.selGroups);
				}
				// create chosen elements and add event listeners
				$(".query-field").chosen({allow_single_deselect:true, width:"120px","disable_search": true})
					.change(function(c){
						var lbl = c.currentTarget.selectedOptions[0].innerHTML;
						t.queryField = c.currentTarget.value;
					 	var nextCho = $(c.currentTarget).parent().parent().find(".query-val");
					 	$(nextCho).empty();
						$(nextCho).append("<option></option>")
					 	if (t.queryField.length > 0){
							$.each(t[t.queryField],function(i,v){
								$(nextCho).append("<option value='" + v + "'>"+ v +"</option")
							});
							$(c.currentTarget).parent().parent().find(".chHide").show();
						}else{
							t.layerDefs = [];
							t.dynamicLayer.setLayerDefinitions(t.layerDefs);
							$(c.currentTarget).parent().parent().find(".chHide").hide();
						}
						$(nextCho).trigger("chosen:updated");
						$("#" + t.id + "add-wrap").hide();
					});	
				$(".query-val").chosen({width:"230px"})
					.change(function(c){
						t.clicks.updateLayerDefs(t);
					var cnt = $(".sel-group-wrap").children().length;
						if (cnt > 5){
							$("#" + t.id + "add-wrap").hide();
						}else{
							$("#" + t.id + "add-wrap").show();
						}
					});	
				$(".hideChosenRow").click(function(c){
					$(c.currentTarget).parent().parent().prev().remove();
					$(c.currentTarget).parent().parent().remove();
					t.clicks.updateLayerDefs(t);
				})	
				$(".andOrRadio").change(function(){
					t.clicks.updateLayerDefs(t);
				})
			},
			updateLayerDefs: function(t){
				var q = "";
				$(".sel-group-wrap").find(".query-field").each(function(i,v){
					var val1 = v.value;
					var val2 = $(v).parent().parent().find(".query-val")[0].value;
					if (i == 0){
						q = val1 + " = '" + val2 + "'";
					}else{
						if (val2){
							var andOr = $(v).parent().parent().prev().find("input:checked")[0].value;
							q = q + " " + andOr	+ " " + val1 + " = '" + val2 + "'";						
						}		
					}	
				})
				t.layerDefs = [];
				t.layerDefs[0] = q;
				t.layerDefs[1] = q;
				t.layerDefs[2] = q;
				t.layerDefs[3] = q;
				t.layerDefs[4] = q;
				t.dynamicLayer.setLayerDefinitions(t.layerDefs);
				t.clicks.graphicQuery(t,q);
			},
			graphicQuery: function(t,q){
				$("#" + t.id + "cfm").html("Click a project for more information");
				$("#" + t.id + "clickRes").slideUp();
				t.map.graphics.clear()
				var mq = new Query();
				var qt = new QueryTask(t.url + "/0" );
				mq.where = q;
				mq.returnGeometry = true;
				mq.outFields = ["*"];
				qt.execute(mq, function(e){
					$.each(e.features, function(i,v){
						var graphic = v;
						graphic.setAttributes(v.attributes);
						graphic.setSymbol(t.symbol);
						t.map.graphics.add(graphic);
					})			
				});
				t.map.graphics.on("mouse-over",function(){
					t.map.setMapCursor("pointer");
				});	
				t.map.graphics.on("mouse-out",function(){
					t.map.setMapCursor("default");
				});
				t.map.graphics.on("click",function(c){
					var a = c.graphic.attributes;
					console.log(a);
					t.clicks.graphicClick(t,a);
				});	
			},
			graphicClick: function(t,a){
				$("#" + t.id + "cfm").html("Selected Project Attributes");
				$("#" + t.id + "clickRes").slideDown();
				var oid = a.OBJECTID
				$.each(t.map.graphics.graphics,function(i,v){
					if (v.attributes){
						if (v.attributes.OBJECTID == oid){
							v.setSymbol(t.symbolS);
						}else{
							v.setSymbol(t.symbol);
						}
					}
				});
				$(".prjInfo").each(function(i,v){
					var sid = v.id.split("-").pop(); 
					if (sid == "Plan_of_Ref_"){
						if (a[sid]){
							$("#" + v.id).html("<a href='" + a[sid] + "' target='_blank'>Link to info</a>");
						}
					}else{
						$("#" + v.id).html(a[sid]);
					}	
				});
				if (t.images[a.Project_Key]){
					$("#" + t.id + "prPhotos").html("");
					$.each(t.images[a.Project_Key],function(i,v){
						var n = i+1;
						if (n == 1){
							$("#" + t.id + "prPhotos").append("<a href='https://ow-maps.s3.amazonaws.com/cn_filterSelect/" + v + "' target='_blank'>Photo " + n + "</a>");
						}else{
							$("#" + t.id + "prPhotos").append(", <a href='https://ow-maps.s3.amazonaws.com/cn_filterSelect/" + v + "' target='_blank'>Photo " + n + "</a>");
						}
					})
				}else{
					$("#" + t.id + "prPhotos").html("None");
				}
			},
			setDisabled: function(t,b){
				var ar = ["slrCh", "popCh"];
				$.each(ar,function(i,v){
					$("#" + t.id + "top-wrap input[name='" + v + "']").each(function(i1,v1){
						$(v1).prop("disabled",b);
					});
				});
			},
			makeVariables: function(t){
				t.atts = [];
				t.chCnt = 0;
				t.images = {
					"1003": ["1003a.JPG", "1003b.JPG", "1003c.JPG", "1003d.JPG"],
					"1004": ["1004a.JPG", "1004b.JPG"],
					"1007": ["1007a.JPG"],
					"1009": ["1009.JPG", "1009b.JPG"],
					"101": ["101a.JPG", "101b.JPG"],
					"102": ["102a.jpg"],
					"103": ["103a.JPG"],
					"104": ["104a.jpg", "104b.JPG", "104c.JPG"],
					"105": ["105a.JPG"],
					"106": ["106a.JPG", "106b.JPG"],
					"107": ["107a.JPG"],
					"108": ["108.JPG"],
					"109": ["109a.JPG"],
					"110": ["110a.JPG", "110b.JPG"],
					"111": ["111a.JPG"],
					"112": ["112.png"],
					"114": ["114a.JPG"],
					"115": ["115a.JPG", "115b.JPG"],
					"116": ["116a.JPG", "116b.JPG", "116c.JPG"],
					"117": ["117a.jpg", "117b.jpg"],
					"118": ["118a.JPG", "118b.JPG"],
					"132": ["132a.JPG", "132b.JPG", "132c.JPG"],
					"144": ["144.JPG", "144a.JPG", "144b.JPG", "144c.JPG", "144d.JPG", "144e.JPG", "144f.JPG"],
					"201": ["201a.jpg"],
					"202": ["202a.jpg", "202b.JPG"],
					"208": ["208a.JPG", "208b.JPG"],
					"211": ["211a.JPG"],
					"216": ["216a.JPG"],
					"217": ["217a.JPG"],
					"218": ["218a.JPG", "218b.JPG"],
					"221": ["221a.jpg"],
					"222": ["222a.jpg"],
					"223": ["223a.JPG"],
					"224": ["224a.JPG", "224b.JPG"],
					"225": ["225a.JPG"],
					"228": ["228a.JPG", "228b.JPG", "228c.JPG", "228d.JPG", "228e.JPG"],
					"232": ["232a.JPG", "232b.JPG"],
					"301": ["301a.JPG", "301b.JPG", "301c.jpg"],
					"304": ["304a.JPG"],
					"307": ["307a.JPG"],
					"308": ["308a.JPG"],
					"309": ["309a.JPG"],
					"310": ["310a.JPG", "310b.JPG"],
					"311": ["311a.JPG"],
					"313": ["313a.JPG", "313b.JPG", "313c.JPG"],
					"315": ["315a.jpg", "315b.JPG"],
					"316": ["316a.JPG"],
					"322": ["322.JPG", "322a.JPG", "322b.JPG", "322c.JPG"],
					"324": ["324.JPG", "324a.JPG", "324b.JPG", "324c.JPG"],
					"326": ["326.JPG", "326a.JPG", "326b.JPG", "326c.JPG", "326d.JPG", "326e.JPG"],
					"327": ["327.JPG", "327a.JPG", "327b.JPG", "327c.JPG", "327d.JPG", "327e.JPG", "327f.JPG", "327g.JPG", "327h.JPG"],
					"401": ["401a.JPG"],
					"402": ["402a.JPG"],
					"403": ["403a.jpg", "403b.jpg"],
					"404": ["404a.JPG"],
					"405": ["405a.jpg", "405b.JPG"],
					"407": ["407a.JPG", "407b.JPG"],
					"409": ["409a.JPG"],
					"410": ["410a.JPG"],
					"411": ["411a.JPG"],
					"413": ["413a.JPG"],
					"414": ["414a.JPG", "414b.JPG"],
					"416": ["416a.JPG"],
					"418": ["418a.JPG", "418b.JPG"],
					"419": ["419a.JPG"],
					"422": ["422a.JPG", "422b.JPG"],
					"423": ["423a.JPG"],
					"424": ["424a.JPG", "424b.JPG"],
					"430": ["430a.JPG"],
					"438": ["438.JPG"],
					"501": ["501a.JPG"],
					"503": ["503a.JPG"],
					"507": ["507a.JPG"],
					"508": ["508a.JPG"],
					"510": ["510a.JPG", "510b.JPG"],
					"511": ["511a.JPG", "511b.JPG"],
					"512": ["512a.JPG"],
					"514": ["514a.JPG"],
					"515": ["515a.JPG"],
					"516": ["516a.JPG"],
					"517": ["517a.JPG"],
					"518": ["518a.JPG"],
					"519": ["519a.JPG", "519b.JPG"],
					"520": ["520a.JPG", "520b.JPG", "520c.JPG"],
					"521": ["521a.JPG"],
					"522": ["522.JPG", "522a.JPG", "522b.JPG", "522c.JPG", "522d.JPG", "522e.JPG", "522f.JPG", "522g.JPG"],
					"604": ["604a.JPG", "604b.JPG", "604c.JPG", "604d.JPG"],
					"605": ["605a.JPG", "605b.JPG", "605c.JPG", "605d.JPG", "605e.JPG"],
					"606": ["606a.JPG", "606b.JPG"],
					"607": ["607a.JPG"],
					"609": ["609a.JPG"],
					"610": ["610a.JPG"],
					"615": ["615.PNG"],
					"620": ["620.jpg", "620a.JPG"],
					"621": ["621.PNG"],
					"622": ["622.jpg"],
					"629": ["629.JPG", "629a.JPG", "629b.JPG", "629c.JPG", "629d.JPG", "629e.JPG", "629f.JPG"],
					"630": ["630.JPG", "630a.JPG", "630b.JPG", "630c.JPG"],
					"631": ["631.PNG", "631a.PNG"],
					"637": ["637.JPG", "637a.JPG", "637b.JPG", "637c.JPG", "637d.JPG", "637e.JPG"],
					"703": ["703a.JPG", "703b.JPG"],
					"704": ["704a.JPG"],
					"705": ["705a.jpg", "705b.JPG"],
					"710": ["710a.JPG"],
					"711": ["711a.JPG"],
					"712": ["712a.jpg", "712b.JPG"],
					"713": ["713a.JPG"],
					"715": ["715.JPG", "715a.JPG"],
					"716": ["716.JPG", "716a.JPG"],
					"717": ["717.JPG", "717a.JPG"],
					"718": ["718.JPG", "718a.JPG"],
					"719": ["719.JPG", "719a.JPG", "719c.JPG", "719d.JPG"],
					"720": ["720.JPG", "720a.JPG", "720b.JPG"],
					"721": ["721.JPG", "721a.JPG", "721b.JPG"],
					"722": ["722.JPG", "722a.JPG", "722b.JPG"],
					"801": ["801a.JPG"],
					"802": ["802a.JPG"],
					"803": ["803a.JPG"],
					"804": ["804a.jpg", "804b.JPG", "804c.JPG"],
					"805": ["805a.JPG", "805b.JPG", "805c.png"],
					"807": ["807a.JPG"],
					"808": ["808a.JPG"],
					"809": ["809a.jpg"],
					"810": ["810a.JPG", "810b.jpg", "810c.jpg", "810d.JPG", "810e.JPG"],
					"811": ["811a.JPG", "811b.JPG", "811c.JPG", "811d.JPG"],
					"812": ["812a.jpg", "812b.jpg", "812c.jpg"],
					"814": ["814a.JPG"],
					"815": ["815a.JPG"],
					"816": ["816a.jpg"],
					"820": ["820a.JPG"],
					"828": ["828.JPG", "828a.jpg"],
					"901": ["901.PNG", "901a.JPG", "901b.JPG", "901c.JPG", "901d.JPG", "901e.JPG", "901f.JPG"],
					"902": ["902a.jpg"],
					"903": ["903a.JPG"],
					"904": ["904a.jpg"],
					"905": ["905a.jpg"],
					"907": ["907a.jpg"],
					"908": ["908a.jpg"],
					"909": ["909a.jpg", "909b.JPG"],
					"912": ["912a.jpg"],
					"913": ["913a.jpg", "913b.jpg"],
					"914": ["914a.jpg"]
				}
			}
        });
    }
);
