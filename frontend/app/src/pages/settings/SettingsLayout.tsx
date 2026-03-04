import { Outlet } from "react-router-dom";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const SettingsLayout = () => {
    return (
        <DashboardLayout title="System Management" noPadding>
            <div className="w-full min-h-screen bg-[#FDFDFE]">
                <div className=" mx-auto p-6 md:p-10">
                    <Outlet />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsLayout;
