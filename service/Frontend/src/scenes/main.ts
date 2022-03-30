import { GameObjects, Physics, Scene } from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import * as SignalR from '@microsoft/signalr';

import { rest_login, rest_register, MASSessionJoinedMessage, signalr_connect } from '../api'

const COLOR_PRIMARY = 0x4e342e;
const COLOR_LIGHT = 0x7b5e57;
const COLOR_DARK = 0x260e04;
const GetValue = Phaser.Utils.Objects.GetValue;

export class MainScene extends Scene {
    rexUI?: RexUIPlugin;
    connection? : SignalR.HubConnection
    constructor() {
        super({ key: "MainScene" });
    }

    protected preload() {
        this.load.image("environment", "assets/background.png");
        this.load.image('user', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/images/person.png');
        this.load.image('password', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/assets/images/key.png');
    }

    private join(sessionName) {
        this.scene.start('ArenaScene', {
            sessionName: sessionName,
        });
    }

    protected create() {
        const that = this;
        // this.add.image(0, 0, "environment").setOrigin(0, 0);
        var print = this.add.text(0, 0, '');

       var loginDialog = this.createLoginDialog({
            x: 400,
            y: 300,
            title: 'Welcome',
            username: 'abc',
            password: '123',
        })
            .on('login', async function (username, password) {
                await rest_login(username, password);
                loginDialog.destroy();
                const joinDialog = that.createJoinSessionDialog()
                    .on('joinSession', async function(sessionName) {
                        joinDialog.destroy();
                        await that.join(sessionName);
                    });
            })
            .on('register', async function (username, password) {
                await rest_register(username, password);
                loginDialog.destroy();
                const joinDialog = that.createJoinSessionDialog()
                    .on('joinSession', async function(sessionName) {
                        joinDialog.destroy();
                        await that.join(sessionName);
                    });
            });

        // var text = this.add.text(300, 10, 'Please enter your name', { color: 'white', fontSize: '20px '});
        // var element = this.add.dom(400, 100).createFromCache('nameform');
    }

    private createJoinSessionDialog() {
        const that = this;
        var sessionName = "";
        var background = this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10, COLOR_PRIMARY);
        var titleField = this.add.text(0, 0, "Join Session");
        var sessionNameField = this.rexUI!.add.label({
            orientation: 'x',
            background: this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, COLOR_LIGHT),
            text: this.rexUI!.add.BBCodeText(0, 0, "", { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
            space: { top: 5, bottom: 5, left: 5, right: 5, icon: 10, }
        })
            .setInteractive()
            .on('pointerdown', function () {
                var config = {
                    onTextChanged: function(textObject, text) {
                        sessionName = text;
                        textObject.text = text;
                    }
                }
                that.rexUI!.edit(sessionNameField.getElement('text') as GameObjects.GameObject, config);
            });
        
        var joinSessionButton = this.rexUI!.add.label({
            orientation: 'x',
            background: this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10, COLOR_LIGHT),
            text: this.add.text(0, 0, 'Login'),
            space: { top: 8, bottom: 8, left: 8, right: 8 }
        })
            .setInteractive()
            .on('pointerdown', function () {
                joinSessionDialog.emit('joinSession', sessionName);
            });

        var joinSessionDialog = this.rexUI!.add.sizer({
            orientation: 'y',
            x: 400,
            y: 300,
        })
            .addBackground(background)
            .add(titleField, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
            .add(sessionNameField, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
            .add(joinSessionButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
            .layout();
        return joinSessionDialog;
    }

    private createLoginDialog(config) {
        const that = this;
        var username = GetValue(config, 'username', '');
        var password = GetValue(config, 'password', '');
        var title = GetValue(config, 'title', 'Welcome');
        var x = GetValue(config, 'x', 0);
        var y = GetValue(config, 'y', 0);
        var width = GetValue(config, 'width', undefined);
        var height = GetValue(config, 'height', undefined);
    
        var background = this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10, COLOR_PRIMARY);
        var titleField = this.add.text(0, 0, title);
        var userNameField = this.rexUI!.add.label({
            orientation: 'x',
            background: this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, COLOR_LIGHT),
            icon: this.add.image(0, 0, 'user'),
            text: this.rexUI!.add.BBCodeText(0, 0, username, { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
            space: { top: 5, bottom: 5, left: 5, right: 5, icon: 10, }
        })
            .setInteractive()
            .on('pointerdown', function () {
                var config = {
                    onTextChanged: function(textObject, text) {
                        username = text;
                        textObject.text = text;
                    }
                }
                that.rexUI!.edit(userNameField.getElement('text') as GameObjects.GameObject, config);
            });
    
        var passwordField = this.rexUI!.add.label({
            orientation: 'x',
            background: this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, COLOR_LIGHT),
            icon: this.add.image(0, 0, 'password'),
            text: this.rexUI!.add.BBCodeText(0, 0, this.markPassword(password), { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
            space: { top: 5, bottom: 5, left: 5, right: 5, icon: 10, }
        })
            .setInteractive()
            .on('pointerdown', function () {
                var config = {
                    type: 'password',
                    text: password,
                    onTextChanged: function(textObject, text) {
                        password = text;
                        textObject.text = that.markPassword(password);
                    }
                };
                that.rexUI!.edit(passwordField.getElement('text') as GameObjects.GameObject, config);
            });
        
        var registerButton = this.rexUI!.add.label({
            orientation: 'x',
            background: this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10, COLOR_LIGHT),
            text: this.add.text(0, 0, 'Register'),
            space: { top: 8, bottom: 8, left: 8, right: 8 }
        })
            .setInteractive()
            .on('pointerdown', function () {
                loginDialog.emit('register', username, password);
            });
    
        var loginButton = this.rexUI!.add.label({
            orientation: 'x',
            background: this.rexUI!.add.roundRectangle(0, 0, 10, 10, 10, COLOR_LIGHT),
            text: this.add.text(0, 0, 'Login'),
            space: { top: 8, bottom: 8, left: 8, right: 8 }
        })
            .setInteractive()
            .on('pointerdown', function () {
                loginDialog.emit('login', username, password);
            });
    
        var loginDialog = this.rexUI!.add.sizer({
            orientation: 'y',
            x: x,
            y: y,
            width: width,
            height: height,
        })
            .addBackground(background)
            .add(titleField, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
            .add(userNameField, 0, 'left', { bottom: 10, left: 10, right: 10 }, true)
            .add(passwordField, 0, 'left', { bottom: 10, left: 10, right: 10 }, true)
            .add(loginButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
            .add(registerButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
            .layout();
        return loginDialog;
    };

    markPassword(password: string) {
        return new Array(password.length + 1).join('•');
    };
}
