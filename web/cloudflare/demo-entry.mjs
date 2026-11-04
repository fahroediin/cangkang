// Entry of the pamanku-demo Worker (wrangler.demo.toml). Steps: cloudflare/DEPLOY-DEMO-CLOUDFLARE.md
import app from '../worker/index.js';
import {demoUser} from '../scripts/dev-demo.mjs';
import panelJS from '../demo/presenter-panel.js';
import config from '../demo/demo.config.json';
import steps from '../demo/steps.json';
import {createDemoWorker} from './demo-core.mjs';

export default createDemoWorker(app,{config,steps,panelJS,identityOf:demoUser});
