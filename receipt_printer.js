
const printAndNewline = new Uint8Array(
  [0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);  

const cutCommand = new Uint8Array(
  [0x1d, 0x56, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); 

const lexicon = ['_', '*'];

const styles = {
    AlternateFont: 'alternate font',
    Bold: 'bold',
    DoubleHeight: 'double height',
    DoubleWidth: 'double width',
    Underline: 'underline'
}
 
class StyledString {
  constructor(style, string) {
    this.style = style;
    this.string = string;
    this.styleCommand = new Uint8Array(
      [0x1b, 0x21, this.styleByte(), 0x0, 0x0, 0x0, 0x0, 0x0]); 
  }

  styleByte() {
    return 
      ((this.style.includes(styles.AlternateFont)) ? 0b00000001 : 0) |
      ((this.style.includes(styles.Bold))          ? 0b00001000 : 0) |
      ((this.style.includes(styles.DoubleHeight))  ? 0b00010000 : 0) |
      ((this.style.includes(styles.DoubleWidth))   ? 0b00100000 : 0) |
      ((this.style.includes(styles.Underline))     ? 0b10000000 : 0);  
  }
}

export class ReceiptPrinter extends HTMLElement {

  static get observedAttributes() {
    return ['shown'];
  }

  get shown() {
    return this.hasAttribute('shown');
  }

  set shown(val) {
    if (val) {
      this.setAttribute('shown', '');
    } else {
      this.removeAttribute('shown');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log("hello");
    if (!this.shown) {
      this.setDisplay('none');
    } else {
      this.setDisplay('');
    }
  }

  constructor() {
    super();
    if (navigator.usb) {
      this.device = undefined;

      this.encoder = new TextEncoder();
      this.decoder = new TextDecoder();

      navigator.usb.addEventListener('connect', () => 
        this.deviceStatus.innerHTML = 'Connected');
      navigator.usb.addEventListener('disconnect', () => 
        this.deviceStatus.innerHTML = 'Disconnected');

      this.deviceStatus = this.appendChild(
        document.createElement('div'));
      this.connectButton = this.appendChild(
        document.createElement('button'));
      this.writeButton = this.appendChild(
        document.createElement('button'));
      this.cutButton = this.appendChild(
        document.createElement('button'));
      this.textarea = this.appendChild(
        document.createElement('textarea'));

      if (!this.shown) {
        this.setDisplay('none');
      }

      this.deviceStatus.innerHTML = 'Disconnected';

      this.connectButton.innerHTML = 'Connect';
      this.connectButton.onclick = () => this.requestDevice(); 

      this.writeButton.innerHTML = 'Print';
      this.writeButton.onclick = () => this.write(); 

      this.cutButton.innerHTML = 'Cut';
      this.cutButton.onclick = () => this.writer(cutCommand);
      
      this.textarea.cols = 42; 
      this.textarea.rows = 10;
    }
  }

  setDisplay(val) {
    this.deviceStatus.style.display = val;
    this.writeButton.style.display  = val;
    this.cutButton.style.display    = val;
    this.textarea.style.display     = val;
  }

  requestDevice() {
    navigator.usb.requestDevice({ filters: [{ vendorId: 0x04b8 }] })
    .then(dev => this.device = dev)
    .then(() => this.device.open())
    .then(() => this.device.selectConfiguration(1))
    .then(() => this.device.claimInterface(0))
    .then(() => this.deviceStatus.innerHTML = 'Connected')
    .catch(error => console.log(error));
  }

  write() {

    // this.parse(this.textarea.value);
    const buffers = [];
    this.textarea.value.split('\n').forEach(line => {
      const l = line + '\n';
      const buffer = this.encoder.encode(l.padEnd(
        l.length + 8 - (l.length % 8), '\0'));
      let slices = [];
      for (var i = 0; i < buffer.length; i += 8){
          slices.push(buffer.slice(i, i + 8));
      }
      buffers.push(slices);
    });
    console.log(buffers.flat());

    buffers.flat().forEach(slice => {
      this.writer(slice);
    });
  }

  writer(slice) {
    this.device.transferOut(1, slice.buffer).then(() => {}); 
    // .then(result => console.log(
    //   'Received', this.decoder.decode(result.data)));
  }

  parse(str) {
    let stack = [];
    for (const delimiter of lexicon) {
      let t = [];
      let i = 0;
      while (true) {
        i = str.indexOf(delimiter, i);
        if (i < 0) {
          break;
        }
        t.push(i);
        i += 1;
      }
      indicies.push(t);
    }
    console.log(indicies);
    
  }
}

customElements.define('receipt-printer', ReceiptPrinter)
