from jinja2 import Environment, FileSystemLoader

# Load templates from templates folder
env = Environment(
    loader=FileSystemLoader("Template"),
    autoescape=True
)

def renderTemplate(templateName, data):
    """
    templateName -> html file name
    data -> dictionary containing variables
    """

    Template = env.get_template(templateName)

    return Template.render(**data)