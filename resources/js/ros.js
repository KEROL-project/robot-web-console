const ros = new ROSLIB.Ros({ url: "ws://localhost:9090" });

ros.on("connection", () => {
  document.getElementById("ros_connection_status").innerHTML = "connected";
});
ros.on("error", (error) => {
  document.getElementById("ros_connection_status").innerHTML = `ROS connection error: (${error})`;
});
ros.on("close", () => {
  document.getElementById("ros_connection_status").innerHTML = "disconnected";
});

const skillExecutionPublisher = new ROSLIB.Topic({
  ros: ros,
  name: '/execute_skill',
  messageType: 'data_collection_msgs/SkillExecutionRequest'
});

const recordDataPublisher = new ROSLIB.Topic({
  ros: ros,
  name: '/record_data',
  messageType: 'data_collection_msgs/DataRecordingRequest'
});

const stopDataPublisher = new ROSLIB.Topic({
  ros: ros,
  name: '/record_data_cancel',
  messageType: 'std_msgs/Empty'
});

const cancelExecutionPublisher = new ROSLIB.Topic({
  ros: ros,
  name: '/cancel_execution',
  messageType: 'std_msgs/Empty'
});

const skillExecutionStatusSubscriber = new ROSLIB.Topic({
  ros: ros,
  name: '/execution_status',
  messageType: 'data_collection_msgs/ExecutionStatus'
});

var skill_execution_statuses = ["unknown", "preparing", "executing", "recovering", "retrying", "stopping", "completed"];
skillExecutionStatusSubscriber.subscribe(function(message) {
  var feedback_str = $('#skill_execution_feedback').val();
  feedback_str += message.skill_name + ' --- ';
  feedback_str += skill_execution_statuses[message.status+1];
  if (message.feedback_str != ""){
    feedback_str += ' --- ' + message.feedback + '\n'
  }
  else{
    feedback_str += '\n';
  }

  $('#skill_execution_feedback').val(feedback_str);
  var bottom_height = $('#skill_execution_feedback').prop('scrollHeight') - $('#skill_execution_feedback').height();
  $('#skill_execution_feedback').scrollTop(bottom_height);
});

const get_topics_proxy = new ROSLIB.Service({
    ros: ros,
    name: "/get_topics",
    serviceType: "data_collection_msgs/GetTopics"
});

$(document).ready(function() {
  var topics_request = {};
  get_topics_proxy.callService(topics_request, function(result){
      $("#topic_names").empty(); 
      var topic_elements = [];
      $.each(result.topics, function(i, item) {
          topic_elements.push('<li class="mb-2"><div class="form-check"><input class="form-check-input topic-checkbox" type="checkbox" value="" id="' + item + '"><label class="form-check-label" for="' + item + '">' + item + '</label></div></li>');
      });
      $("#topic_names").append(topic_elements.join(''));
  });

  $('#execute').click(function() {
    var skill_type = parseInt($('#skill_type').val());
    var model_name = $('#model_name').val();
    var skill_description = $('#skill_description').val();
    var check_preconditions = $('#check_preconditions_checkbox').is(':checked');

    const message = new ROSLIB.Message({
      skill_type: skill_type,
      model_name: model_name,
      skill_description: skill_description,
      check_preconditions: check_preconditions
     });

     skillExecutionPublisher.publish(message);
     $('#skill_execution_feedback').val('');
     console.log(`Published message: ${message} to topic: ${skillExecutionPublisher}`);
  });

  $('#record').click(function() {
    var selectedTopics = [];
    $(".topic-checkbox").each(function() {
        if (this.checked) {
          selectedTopics.push(this.id);
        }
    });

    if(selectedTopics.length > 0){
        const message = new ROSLIB.Message({ topics: selectedTopics });
        recordDataPublisher.publish(message);
        console.log(`Published message: ${message} to topic: ${recordDataPublisher}`);
    }
    $("#selected_topics").text(JSON.stringify(selectedTopics, null, 2));
  });

  $('#stop').click(function() {
    const message = new ROSLIB.Message({});
    stopDataPublisher.publish(message);
    cancelExecutionPublisher.publish(message);
    console.log(`Published message: ${message} to topics ${stopDataPublisher} and ${cancelExecutionPublisher}`);
  });

  $("#startStream").click(function() {
    const topicName = document.getElementById("cam_topic_name").value.trim();
    const availableTopics = [];
    
    $(".topic-checkbox").each(function() {
        availableTopics.push(this.id);
    });

    if (availableTopics.includes(topicName)) {
        const imageElement = '<img src="http://localhost:8080/stream?topic=' + topicName + '" />';
        $("#video-stream").html(imageElement);
        console.log(`Streaming started for topic: ${topicName}`);
    } else {
        alert(`Error: Topic "${topicName}" is not available. Please select a valid topic.`);
        console.error(`Topic "${topicName}" not found in the available topics.`);
    }
  });

  $("#stopStream").click(function() {
    $("#video-stream").empty();
    console.log("Streaming stopped.");
  });

});