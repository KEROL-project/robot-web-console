import base64
import numpy as np
from io import BytesIO
from PIL import Image

from masonite.controllers import Controller
from masonite.views import View
from masonite.request import Request

from black_box_tools.db_utils import DBUtils
import base64

def convert_image_to_str(img):
    img = np.array(img, dtype=np.uint8)
    img = Image.fromarray(img)
    buffer = BytesIO()
    img.save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

class AnnotationsController(Controller):
    def __init__(self):
        self.db_client = DBUtils.get_db_client()

    def show(self, view: View):
        return view.render("annotations")

    def get_datasets(self, request: Request):
        robot = request.input('robot')
        db = self.db_client[robot]
        data_collection_names = db.list_collection_names()
        return data_collection_names

    def get_observation_names(self, request: Request):
        robot = request.input('robot')
        dataset = request.input('dataset')
        doc = DBUtils.get_oldest_doc(db_name=robot, collection_name=dataset)
        observation_names = [observation for observation in doc['observation']
                             if ('image' in observation) or ('img' in observation)]
        return observation_names

    def retrieve_data(self, request: Request):
        robot = request.input('robot')
        dataset = request.input('dataset')
        observation_name = request.input('observation')
        current_collection_docs = DBUtils.get_docs(db_name=robot, collection_name=dataset)
        image_ids = []
        image_strings = []
        if current_collection_docs:
            for i, doc in enumerate(current_collection_docs):
                img = doc['observation'][observation_name]
                img_str = convert_image_to_str(img)
                image_ids.append(i)
                image_strings.append(img_str)
            return {'image_ids': image_ids, 'image_data': image_strings}

    def save_annotation(self, request: Request):
        robot = request.input('robot')
        dataset = request.input('dataset')
        current_img_id = request.input("image_id")
        annotation_data = request.input("annotation")
        anomaly_stage = request.input("anomaly_stage")

        client = DBUtils.get_db_client()
        db = client[f"{robot}-annotations"]
        collection = db[f"{dataset}"]

        collection.update_one(
            {"image_id": current_img_id,
             "anomaly_stage": anomaly_stage},
            {"$set": {"annotation": annotation_data}},
            upsert=True
        )

        return {"status": "ok"}