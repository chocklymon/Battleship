$(document).ready(function(){

  $("#createGameButton").click(function() {
    $(".createGameOverlay").css("display", "block");
    $(".createGameModal").css("display", "block");
  });

  $("#cancelCreateGameButton").click(function() {
    $(".createGameOverlay").css("display", "none");
    $(".createGameModal").css("display", "none");
  });

  $("#finalCreateGameButton").click(function() {
    console.log("We should actually send information to the server at this point");
    $(".createGameOverlay").css("display", "none");
    $(".createGameModal").css("display", "none");
  });

});
