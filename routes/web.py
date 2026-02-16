from masonite.routes import Route

ROUTES = [
    Route.get("/", "IndexController@show"),
    Route.get("/index", "IndexController@show"),
    Route.get("/annotations", "AnnotationsController@show"),
    Route.get('/annotations/get_datasets', 'AnnotationsController@get_datasets'),
    Route.get('/annotations/get_observation_names', 'AnnotationsController@get_observation_names'),
    Route.get('/annotations/retrieve_data', 'AnnotationsController@retrieve_data'),
    Route.get('/annotations/get_next_image', 'AnnotationsController@get_next_image'),
    Route.get('/annotations/get_previous_image', 'AnnotationsController@get_previous_image'),
    Route.get("/annotations/save_annotation", "AnnotationsController@save_annotation")
    ]
