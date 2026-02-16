var currentImgIndex = 0;
var imageIds = [];
var imageData = [];

$(document).ready(function() {
    $("#robot").on("change", function() {
        var robot = $('#robot').val();
        if (robot == "") {
            $("#retrieve-data").prop('disabled', true);
            $("#datasets").empty();
            return;
        }

        $.ajax({
            url: "/annotations/get_datasets",
            type: 'get',
            data: { robot: robot },
            contentType: 'application/json',
            cache: false
          }).done(function(data_collection_names) {
            $('#datasets').append($('<option>', { 
                value: "",
                text : "Select dataset..." 
            }));
            $.each(data_collection_names, function (i, item) {
                $('#datasets').append($('<option>', { 
                    value: item,
                    text : item 
                }));
            });
            $("#retrieve-data").prop('disabled', false);
          });
    });

    $("#datasets").on("change", function() {
        var robot = $('#robot').val();
        var dataset = $('#datasets').val();
        if (dataset == "") {
            $("#retrieve-data").prop('disabled', true);
            $("#observations").empty();
            return;
        }

        $.ajax({
            url: "/annotations/get_observation_names",
            type: 'get',
            data: { robot: robot, dataset: dataset },
            contentType: 'application/json',
            cache: false
          }).done(function(observation_names) {
            $('#observations').append($('<option>', {
                value: "",
                text : "Select observation..."
            }));
            $.each(observation_names, function (i, item) {
                $('#observations').append($('<option>', {
                    value: item,
                    text : item
                }));
            });
          });
    });

    $("#observations").on("change", function() {
        var robot = $('#robot').val();
        var dataset = $('#datasets').val();
        var observation = $('#observations').val();
        if (observation == "") {
            $("#retrieve-data").prop('disabled', true);
            return;
        }

        if (robot != "" && dataset != "") {
            $("#retrieve-data").prop('disabled', false);
        }
        else {
            $("#retrieve-data").prop('disabled', true);
        }
    });

    $('#retrieve-data').click(function() {
        var robot = $('#robot').val();
        var dataset = $('#datasets').val();
        var observation = $('#observations').val();
        $("#statusSpinner").css('display', 'block');
        $.ajax({
            url: "/annotations/retrieve_data",
            type: 'get',
            data: { robot: robot,
                    dataset: dataset,
                    observation: observation },
            contentType: 'application/json',
            cache: false
          }).done(function(result) {
            imageIds = result.image_ids;
            imageData = result.image_data;

            if (imageIds.length > 0){
                currentImgIndex = 0;
                displayImage(imageData[0]);

                $("#previous-image").prop('disabled', true);
                $("#next-image").prop('disabled', false);
                updateImageCounter();
            }
            $("#statusSpinner").css('display', 'none');
        });
    });

    $('#next-image').click(function() {
        var robot = $('#robot').val();
        var dataset = $('#datasets').val();
        if ((currentImgIndex + 1) < imageIds.length) {
            currentImgIndex = currentImgIndex + 1;
            displayImage(imageData[currentImgIndex]);
            $("#previous-image").prop('disabled', false);
            if (currentImgIndex == (imageIds.length - 1)) {
                $("#next-image").prop('disabled', true);
            }
            updateImageCounter();
        }
    });

    $('#previous-image').click(function() {
        var robot = $('#robot').val();
        var dataset = $('#datasets').val();
        if ((currentImgIndex - 1) >= 0) {
            currentImgIndex = currentImgIndex - 1;
            displayImage(imageData[currentImgIndex]);
            $("#next-image").prop('disabled', false);
            if (currentImgIndex == 0) {
                $("#previous-image").prop('disabled', true);
            }
            updateImageCounter();
        }
    });

    $('#save-annotation').click(function () {
        const robot = $('#robot').val();
        const dataset = $('#datasets').val();
        const annotation = $('#annotation-text').val();
        const anomaly_stage = $('input[name="annotationType"]:checked').val();

        $.ajax({
            url: "/annotations/save_annotation",
            type: "get",
            data: {
                robot: robot,
                dataset: dataset,
                image_id: currentImgIndex,
                annotation: annotation,
                anomaly_stage: anomaly_stage
            },
            contentType: 'application/json'
        }).done(function(result) {
            console.log("Annotation saved");
        });
    });
});

function displayImage(image_data) {
    $("#openseadragon-viewer").empty();
    var viewer = OpenSeadragon({
        id: "openseadragon-viewer",
        prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@5.0/build/openseadragon/images/",
        tileSources: {
          type: "image",
          url: "data:image/jpg;base64," + image_data
        },
        showNavigator: true,
        showFullPageControl: true,
        showZoomControl: true,
        showRotationControl: true
    });
}

function updateImageCounter() {
    $("#image-counter").text(`Image ${currentImgIndex+1} / ${imageIds.length}`);
}