const routes = [
    {
        method: "POST",
        path: "/create-medusa-user",
        handler: "setup.createMedusaUser"
    },
    {
        method: "POST",
        path: "/synchronise-medusa-tables",
        handler: "setup.synchroniseWithMedusa"
    }
];

export default routes;
