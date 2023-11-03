from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, EmailField
from wtforms.validators import DataRequired, Email, EqualTo, Regexp, length


regex_pattern = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=()])(?=\\S+$).{8,}$"


class LoginForm(FlaskForm):
    """Renders Login Form"""
    """Flask Form used for logging in the user"""
    email = EmailField('Email', validators=[DataRequired(message='Email cannot be left blank.'),
                                            Email(message='Enter a valid email address')])
    password = PasswordField('Password', validators=[DataRequired(message='Password cannot be left blank.')])
    submit = SubmitField('Login')


class SignupForm(FlaskForm):
    """Renders the Signup Form"""
    first_name = StringField(validators=[
        DataRequired(message='This field cannot be left empty'),
        length(max=46, message='The maximum character length is 46 characters.')
    ])
    last_name = StringField(validators=[
        DataRequired(message='This field cannot be left empty'),
        length(max=46, message='The maximum character length is 46 characters.')
    ])
    email = EmailField(validators=[
        DataRequired(message='This field cannot be left empty'),
        Email(message='Please provide a valid email address')
    ])
    password1 = PasswordField(
        label='Enter the Password',
        validators=[
            DataRequired(message='This field cannot be left empty'),
            Regexp(
                regex_pattern,
                message='Password should be minimum eight characters long, at least one uppercase letter, one lowercase letter, one number and one special character.')
        ])
    password2 = PasswordField(
        label='Verify your Password',
        validators=[
            DataRequired(message='Password cannot be left blank'),
            EqualTo('password1', message='Passwords do not match')])
    submit = SubmitField('Signup')
