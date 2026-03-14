from datetime import datetime


def success(
        data=None,
        message="success"
):

    return {

        "status":"success",

        "message":message,

        "data":data,

        "timestamp":str(datetime.utcnow())

    }



def error(
        message="error",
        code=400
):

    return {

        "status":"error",

        "message":message,

        "code":code,

        "timestamp":str(datetime.utcnow())

    }



def created(
        data=None,
        message="created"
):

    return {

        "status":"success",

        "message":message,

        "data":data,

        "timestamp":str(datetime.utcnow())

    }



def validation_error(message):

    return {

        "status":"fail",

        "message":message

    }