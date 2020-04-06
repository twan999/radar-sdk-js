import * as Cookie from '../cookie';
import * as Device from '../device';
import * as Http from '../http';
import Navigator from '../navigator';

// consts
import SDK_VERSION from '../version';
import STATUS from '../status_codes';

class Track {
  static trackOnce(callback) {
    Navigator.getCurrentPosition((status, { latitude, longitude, accuracy }) => {
      if (status !== STATUS.SUCCESS) {
        if (callback) {
          callback(status);
        }
        return;
      }

      this.trackOnceWithLocation({ latitude, longitude, accuracy },
        (status, location, user, events) => {
          if (callback) {
            callback(status, location, user, events);
          }
          return;
        }
      );
    });
  }

  static trackOnceWithLocation({ latitude, longitude, accuracy }, callback) {
    // Get user data
    const deviceId = Device.getId();
    const userId = Cookie.getCookie(Cookie.USER_ID);
    const description = Cookie.getCookie(Cookie.DESCRIPTION);
    const _id = userId || deviceId;

    const body = {
      accuracy,
      description,
      deviceId,
      deviceType: 'Web',
      foreground: true,
      latitude,
      longitude,
      sdkVersion: SDK_VERSION,
      stopped: true,
      userId,
    };

    const httpCallback = (status, response) => {
      if (status === STATUS.SUCCESS) {
        if (callback) {
          callback(STATUS.SUCCESS, { latitude, longitude, accuracy }, response.user, response.events);
        }
      } else {
        if (callback) {
          callback(status);
        }
      }
    };

    Http.request('PUT', `v1/users/${_id}`, body, httpCallback);
  }
}

export default Track;