import React from 'react';
import FlexModal from './FlexModal';
import AppAnnotationStore from './../flux/AnnotationStore';
import AnnotationActions from './../flux/AnnotationActions';
import IDUtil from '../util/IDUtil';

class LoginBox extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedAction: "login",
            username: "",
            password: "",
            warningMsg: null,
            showLoginModal: false,
            user: null,
            loggedIn: false,
            loginButtonLabel: "Login"
        }
        this.userNameRef = React.createRef();
        this.pwRef = React.createRef();
        this.CLASS_PREFIX = 'lb'
    }

    componentDidMount() {
        AppAnnotationStore.bind('login-succeeded', this.loginSuccess.bind(this));
        AppAnnotationStore.bind('register-succeeded', this.loginSuccess.bind(this));
        AppAnnotationStore.bind('login-failed', this.loginFailed.bind(this));
        AppAnnotationStore.bind('register-failed', this.loginFailed.bind(this));
    }

    handleLogin = () => {
        if (!this.state.loggedIn) {
            this.setState({showLoginModal: true});
        } else {
            this.setState({
                user: null,
                loggedIn: false,
                loginButtonLabel: "Login"
            });
            AnnotationActions.logoutUser();
            localStorage.removeItem("userDetails");
        }
    };

    loginSuccess = userDetails => {
        this.setState({
            user: userDetails,
            loggedIn: true,
            loginButtonLabel: "Logout " + userDetails.username,
            warningMsg: null
        });
        localStorage.setItem("userDetails", JSON.stringify(userDetails));
        this.hideLoginForm();
    };

    loginFailed = error => {
        this.setState({
            warningMsg: error.message
        });
    };

    showLoginForm = () => {
        this.setState({showLoginModal: true});
    };

    hideLoginForm = e => {
        this.setState({showLoginModal: false});
    };

    handleActionChange = e => {
        this.setState({selectedAction: e.target.value});
    };

    handleSubmit = e => {
        e.preventDefault();
        let userDetails = {
            username: this.userRef.current.value,
            password: this.pwRef.current.value
        }
        if (this.state.selectedAction === "register") {
            AnnotationActions.registerUser(userDetails);
        } else {
            AnnotationActions.loginUser(userDetails);
        }
    };

    renderLoginForm = (selectedAction, warningMsg, submitFunc, actionChangeFunc) => {
        return (
            <div className={IDUtil.cssClassName('panel', this.CLASS_PREFIX)}>
                <div className={IDUtil.cssClassName('mode-select', this.CLASS_PREFIX)}>
                    <label className={selectedAction === "login" ? "active" : null}>
                        <input type="radio" value="login"
                            checked={selectedAction === "login"}
                            onChange={actionChangeFunc}
                        /> Login
                    </label>
                    <label className={selectedAction === "register" ? "active" : null}>
                        <input type="radio" value="register"
                            checked={selectedAction === "register"}
                            onChange={actionChangeFunc}
                        /> Register
                    </label>
                </div>

                <form className={IDUtil.cssClassName('form', this.CLASS_PREFIX)} onSubmit={submitFunc}>
                    <div className={IDUtil.cssClassName('form-row', this.CLASS_PREFIX)}>
                        <label>User Name</label>
                        <input
                            ref={this.userNameRef}
                            className={IDUtil.cssClassName(warningMsg ? 'input invalid' : 'input')}
                            type="text"
                            placeholder="username"
                        />
                        <div className="invalid-feedback">{warningMsg}</div>
                    </div>

                    <div className={IDUtil.cssClassName('form-row', this.CLASS_PREFIX)}>
                        <label>Password</label>
                        <input
                            ref={this.pwRef}
                            className={IDUtil.cssClassName(warningMsg ? 'input invalid' : 'input')}
                            type="password"
                            placeholder="password"
                        />
                        <div className="invalid-feedback">{warningMsg}</div>
                    </div>

                    <input
                        type="submit"
                        className={IDUtil.cssClassName('btn')}
                        value={selectedAction === "login" ? "Login" : "Register"}
                    />
                </form>
            </div>
        )
    };

    render() {
        const loginForm = this.renderLoginForm(
            this.state.selectedAction,
            this.state.warningMsg,
            this.state.handleSubmit,
            this.handleActionChange
        );
        return (
            <div className={IDUtil.cssClassName('login-box')}>
                <button className={IDUtil.cssClassName('btn')} onClick={this.handleLogin}>
                    {this.state.loginButtonLabel}
                </button>
                {this.state.showLoginModal ?
                    <FlexModal
                        elementId="login__modal"
                        onClose={this.hideLoginForm}
                        title="Login or Register">
                        {loginForm}
                    </FlexModal>: null
                }
            </div>
        );
    }
}

export default LoginBox;
