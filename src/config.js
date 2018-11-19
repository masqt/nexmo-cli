import fs      from 'fs';
import ini     from 'ini';

class Config {
  constructor(emitter, type="rc") {
    this.emitter = emitter;
    this.type = type;
  }

  read() {
    const envApiKey = process.env.NEXMO_API_KEY;
    const envApiSecret = process.env.NEXMO_API_SECRET;

    if (envApiKey && envApiSecret) {
      this.credentials = {
        'credentials': {
          'api_key': envApiKey,
          'api_secret': envApiSecret
        }
      };
    } else {
      this.credentials = ini.parse(
        fs.readFileSync(this.readFilename(), 'utf-8')
      );
    }
    return this.credentials;
  }

  write(data, local=false) {
    fs.writeFileSync(
      this.writeFilename(local),
      ini.stringify(data)
    );
  }

  readFilename() {
    let filename = localFile(this.type);
    if (fs.existsSync(filename)) {
      return filename;
    } else {
      return homeFile(this.type);
    }
    return homeFile();
  }

  writeFilename(local=false) {
    if (local) { return localFile(this.type); }
    else { return homeFile(this.type); }
  }

  putAndSave(values, writeLocal=false) {
    let data = {};

    try {
      data = this.read();
    } catch (e) {
      this.emitter.warn('No existing config found. Writing to new file.');
    }

    for (const group in values) {
      data[group] = data[group] || {};
      const vals = values[group];
      for (const key in vals) {
        data[group][key] = vals[key];
      }
    }

    try {
      this.write(data, writeLocal);
      this.emitter.log(`Credentials written to ${this.writeFilename(writeLocal)}`);
    } catch (e) {
      this.emitter.error(`Could not write credentials to ${this.writeFilename(writeLocal)}. (${e.message})`);
    }
    return data;
  }
}

export default Config;

// private methods

let localFile = function(type) {
  return `${process.cwd()}/.nexmo${type}`;
};

let homeFile = function(type) {
  let key = (process.platform == 'win32') ? 'USERPROFILE' : 'HOME';
  return `${process.env[key]}/.nexmo${type}`;
};
