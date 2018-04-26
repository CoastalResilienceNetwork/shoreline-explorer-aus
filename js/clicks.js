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
				})
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
			}
        });
    }
);
