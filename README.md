# Frutiger Aero Theme for CTFd

A participant-facing Frutiger Aero theme for CTFd 3.8.6. The administrator
interface is not changed.

Sound is on by default. The Sound button saves your mute preference; browsers
may require a click or keypress before hover sounds can play. Reduced-motion
preferences disable the ambient movement.

## Installation

From the root of your CTFd checkout, run:

```bash
git clone https://github.com/TheOriginalOrangeJuice/RCC-frutiger-aero-theme.git CTFd/themes/frutiger-aero
```

Restart CTFd, then open **Admin Panel → Config → Theme** and select
`frutiger-aero`.

The compiled assets are included. To rebuild them after editing the theme:

```bash
cd CTFd/themes/frutiger-aero
yarn install --frozen-lockfile
yarn build
```
