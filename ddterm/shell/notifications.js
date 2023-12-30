/*
    Copyright © 2023 Aleksandr Mezin

    This file is part of ddterm GNOME Shell extension.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import GObject from 'gi://GObject';
import Pango from 'gi://Pango';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageList from 'resource:///org/gnome/shell/ui/messageList.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

class SharedBase {
    constructor(factory) {
        this._factory = factory;
        this._instance = null;
    }

    get() {
        if (this._instance)
            return this._instance;

        this._instance = this._factory();

        this._instance.connect('destroy', () => {
            this._instance = null;
        });

        return this._instance;
    }

    destroy(reason = MessageTray.NotificationDestroyedReason.SOURCE_CLOSED) {
        this._instance?.destroy(reason);
    }
}

export class SharedNotificationSource extends SharedBase {
    constructor(title, icon_name) {
        super(() => {
            const source = new MessageTray.Source(title, icon_name);
            Main.messageTray.add(source);
            return source;
        });
    }
}

export class SharedNotification extends SharedBase {
    constructor(source, title, banner, params) {
        super(() => new MessageTray.Notification(source.get(), title, banner, params));
    }

    show() {
        const notification = this.get();

        notification.source.showNotification(notification);
    }
}

const ErrorLogNotificationBanner = GObject.registerClass({
}, class DDTermErrorLogNotificationBanner extends MessageTray.NotificationBanner {
    _init(notification) {
        super._init(notification);

        const expand_label = new MessageList.URLHighlighter(
            notification.bannerBodyText,
            true,
            notification.bannerBodyMarkup
        );

        expand_label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        const scroll_area = new St.ScrollView({
            style_class: 'vfade',
            overlay_scrollbars: true,
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            visible: this.expanded,
        });

        const viewport = new St.BoxLayout({ vertical: true });

        viewport.add_actor(expand_label);
        scroll_area.add_actor(viewport);
        this.setExpandedBody(scroll_area);

        const disconnect = [];

        const disconnect_all = () => {
            while (disconnect.length)
                disconnect.pop()();
        };

        const connect = (source, signal, handler) => {
            const handler_id = source.connect(signal, handler);
            disconnect.push(() => source.disconnect(handler_id));
        };

        connect(this, 'destroy', disconnect_all);
        connect(notification, 'destroy', disconnect_all);
        connect(notification, 'updated', () => {
            expand_label.setMarkup(notification.bannerBodyText, notification.bannerBodyMarkup);
        });
    }
});

export const ErrorLogNotification = GObject.registerClass({
}, class DDTermErrorLogNotification extends MessageTray.Notification {
    createBanner() {
        return new ErrorLogNotificationBanner(this);
    }
});
