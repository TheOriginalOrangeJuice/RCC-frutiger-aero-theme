# Frutiger Aero Theme for CTFd

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
