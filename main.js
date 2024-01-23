$(document).ready(function(){
    //do something
    $("#thisButton").click(function(){
        processImage();
        processTranslate();
    });
});

var sentence = ""
// console.log("sentence:", sentence);
function processImage() {
    // **********************************************
    // *** Update or verify the following values. ***
    // **********************************************
    

    $("#RecognitionComicWords").empty();
   
    let endpoint = "https://eastus.api.cognitive.microsoft.com/";
    if (!subscriptionKey) { throw new Error('Set your environment variables for your subscription key and endpoint.'); }
    var uriBase = endpoint + "vision/v2.1/ocr";

    // Display the image.
    var sourceImageUrl = document.getElementById("inputImage").value;
    document.querySelector("#sourceImage").src = sourceImageUrl;

    // This operation requires two REST API calls. One to submit the image
    // for processing, the other to retrieve the text found in the image.
    //
    // Make the first REST API call to submit the image for processing.
    $.ajax({
        url: uriBase,
        // Request headers.
        beforeSend: function(jqXHR){
            jqXHR.setRequestHeader("Content-Type","application/json");
            jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        
        // Request body.
        data: '{"url": ' + '"' + sourceImageUrl + '"}',
    })

    .done(function(data, textStatus, jqXHR) {
        console.log(data);
        $("#responseTextArea").val(JSON.stringify(data, null, 2));
        for(let x of data.regions){
            for(var i = 0 ; i < x.lines.length ; i++){
                // $("#RecognitionComicWords").append("line box:", x.lines[i].boundingBox);
                if (i < x.lines.length-1){
                var thislinebox = x.lines[i].boundingBox.split(',');
                var lastlinebox = x.lines[i+1].boundingBox.split(',');
                if (Math.abs(Number(lastlinebox[0])-Number(thislinebox[0])) > 50 && Math.abs(Number(lastlinebox[1])-Number(thislinebox[1])) > 50 ){
                    $("#RecognitionComicWords").append("<br>");
                    sentence += "\n";
                    }
                }
            // for(let y of x.lines){
                for(let z of x.lines[i].words){
                    var thisbox = z.boundingBox.split(',');
                    // $("#RecognitionComicWords").append(Number(thisbox[0])," ",Number(thisbox[1])," ",Number(thisbox[2])," ",Number(thisbox[3]), " ");
                    if (Number(thisbox[2])>15 && Number(thisbox[3])>15){
                        $("#RecognitionComicWords").append(z.text);
                        sentence += z.text;
                    }
                }
            }
            $("#RecognitionComicWords").append("<br><br>");
        }

    console.log("sentence:", sentence);
    var trans_sentence = processTranslate(sentence)
    // Canvas add face rectangle
    var canvas_side = 20;
    var canvas_scale = 0.35
    var thisImage = new Image();
    thisImage.src = sourceImageUrl;
    var thisCanvasCTX = $("#myCanvas")[0].getContext("2d");
    thisImage.onload = function(){
        thisCanvasCTX.canvas.width = thisImage.width *canvas_scale;
        thisCanvasCTX.canvas.height = thisImage.height *canvas_scale;
        thisCanvasCTX.drawImage(thisImage,0,0,thisImage.width *canvas_scale,thisImage.height *canvas_scale);
        thisCanvasCTX.scale(canvas_scale,canvas_scale)
        thisCanvasCTX.lineWidth = 5;
        thisCanvasCTX.strokeStyle = "red";    //white
        thisCanvasCTX.fillStyle = "black";
        thisCanvasCTX.font = "20pt Arial";

        for(let x of data.regions){
            for(let y of x.lines){
                for(let z of y.words){
                    var thisWordRect = z.boundingBox.split(',');
                    if (Number(thisWordRect[2])>15 && Number(thisWordRect[3])>15){
                    thisCanvasCTX.clearRect(Number(thisWordRect[0]), Number(thisWordRect[1]), Number(thisWordRect[2])+canvas_side, Number(thisWordRect[3])+canvas_side);
                    thisCanvasCTX.fillText("X", Number(thisWordRect[0]), Number(thisWordRect[1]));
                }
                };
            };                  //clearRect  strokeRect fillRect
        };
    };
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        // Put the JSON description into the text area.
        $("#responseTextArea").val(JSON.stringify(data, null, 2));

        // Display error message.
        var errorString = (errorThrown === "") ? "Error. " :
            errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" :
            (jQuery.parseJSON(jqXHR.responseText).message) ?
                jQuery.parseJSON(jqXHR.responseText).message :
                jQuery.parseJSON(jqXHR.responseText).error.message;
        alert(errorString);
    });
};


// -----------------------------------------------------------------------------------------------------------------------------
function processTranslate(sentence) {
    var trans_sentence = ""

    let uriBase = "https://api.cognitive.microsofttranslator.com/translate";
    let params = {
        "api-version": "3.0",
        // "from":"ja",
        "to": "zh-Hant"              //zh-Hant,ja,ko,en"  en,ja,
    };

    //取得要翻譯的文字
    // console.log("sentence:", sentence);
    // var sentence_test = "Hello, my name is Tom."
    // let sourceTranslateText = document.getElementById("inputText").value;
    let sourceTranslateText = sentence;
    // let sourceTranslateText = document.getElementById("#RecognitionComicWords").value;   //RecognitionComicWords

    //送出分析
    $.ajax({
        url: uriBase + "?" + $.param(params),
        // Request header
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", trans_subscriptionKey);
            // 如果不是設定全域，就要加上這一行指定你所選擇的區域
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Region", "eastus");
        },
        type: "POST",
        // Request body
        data: '[{"Text": ' + '"' + sourceTranslateText + '"}]',
    })
    .done(function(data) {
        //顯示JSON內容
        $("#translateResult").empty()
        $("#responseTextArea").val(JSON.stringify(data, null, 2));
        //修改下面這一行將翻譯結果顯示於右方
        for (var i =0; i<data[0].translations.length; i++){
            $("#translateResult").append(data[0].translations[i].text + "<br>");
            trans_sentence += data[0].translations[i].text + "\n";
        }
        // $("#translateResult").text(data[0].translations[0].text);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        //丟出錯誤訊息
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : jQuery.parseJSON(jqXHR.responseText).message;
        alert(errorString);
    });
    console.log(trans_sentence)
    return trans_sentence;
};




// -----------------------------------------------------------------------------------------------------------------------------
// 上傳圖片
// function processImageFile(imageObject) {

//     //確認區域與所選擇的相同或使用客製化端點網址
//     var url = "https://eastus.api.cognitive.microsoft.com/";
//     // var uriBase = url + "vision/v2.1/analyze";
//     var uriBase = url + "vision/v2.1/ocr";

//     var sourceImageUrl = document.getElementById("inputImage").value;
//     document.querySelector("#sourceImage").src = sourceImageUrl;

//     //顯示分析的圖片
//     // var sourceImageUrl = document.getElementById("inputImage").value;
//     var sourceImageUrl = URL.createObjectURL(imageObject);
//     console.log("sourceImageUrl:", sourceImageUrl);
//     document.querySelector("#sourceImage").src = sourceImageUrl;
//     //送出分析
//    $.ajax({
//         url: uriBase,

//         // Request headers.
//         beforeSend: function(jqXHR){
//             jqXHR.setRequestHeader("Content-Type","application/json");
//             jqXHR.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
//         },

//         type: "POST",

//         // Request body.
//         data: '{"url": ' + '"' + sourceImageUrl + '"}',
//     })
//     .fail(function(jqXHR, textStatus, errorThrown) {
//         // Put the JSON description into the text area.
//         $("#responseTextArea").val(JSON.stringify(data, null, 2));

//         // Display error message.
//         var errorString = (errorThrown === "") ? "Error. " :
//             errorThrown + " (" + jqXHR.status + "): ";
//         errorString += (jqXHR.responseText === "") ? "" :
//             (jQuery.parseJSON(jqXHR.responseText).message) ?
//                 jQuery.parseJSON(jqXHR.responseText).message :
//                 jQuery.parseJSON(jqXHR.responseText).error.message;
//         alert(errorString);
//     });
// };


// ==========================================================================================================



// $(document).ready(function(){
//     //do something
//     $("#thisButton").click(function(){
//         processImage();
//     });
//     $("#inputImageFile").change(function(e){
//         processImageFile(e.target.files[0]);
//     });
// });

// function processImage() {
    
//     //確認區域與所選擇的相同或使用客製化端點網址
//     var url = "https://westus3.api.cognitive.microsoft.com/";
//     // var uriBase = url + "vision/v2.1/analyze";
//     var uriBase = url + "vision/v2.1/describe";
    
//     // var params = {
//     //     "visualFeatures": "Adult,Brands,Categories,Description,Faces,Objects,Tags",
//     //     "details": "Landmarks",
//     //     "language": "zh",
//     // };
//     var params = {
//         "maxCandidates": "10",
//         "language": "zh",
//     };
//     //顯示分析的圖片
//     var sourceImageUrl = document.getElementById("inputImage").value;
//     document.querySelector("#sourceImage").src = sourceImageUrl;
//     //送出分析
//     $.ajax({
//         url: uriBase + "?" + $.param(params),
//         // Request header
//         beforeSend: function(xhrObj){
//             xhrObj.setRequestHeader("Content-Type","application/json");
//             xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
//         },
//         type: "POST",
//         // Request body
//         data: '{"url": ' + '"' + sourceImageUrl + '"}',
//     })
//     .done(function(data) {
//         //顯示JSON內容
//         $("#responseTextArea").val(JSON.stringify(data, null, 2));
//         $("#picDescription").empty();
//         // $("#picDescription").append(data.description.captions[0].text+"<br>");
//         // $("#picDescription").append("這裡有 " + data.faces.length + " 個人。");
//         for(let x of data.description.captions){
//             $("#picDescription").append(x.text+"<br>");
//         }
//         // $("#picDescription").append(data.description.captions[0].text+"<br>");
//     })
//     .fail(function(jqXHR, textStatus, errorThrown) {
//         //丟出錯誤訊息
//         var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
//         errorString += (jqXHR.responseText === "") ? "" : jQuery.parseJSON(jqXHR.responseText).message;
//         alert(errorString);
//     });
// };

