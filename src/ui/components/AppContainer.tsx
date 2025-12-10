/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param, jsdoc/require-param-type, jsdoc/require-returns, jsdoc/require-returns-type, jsdoc/check-tag-names */
import { useState } from "react";
import { useUserManagement } from "../hooks/useUserManagement";
import { usePropertyManagement } from "../hooks/usePropertyManagement";
import { ElectronUnavailableView } from "../views/ElectronUnavailableView";
import { ProfileSelectionView } from "../views/ProfileSelectionView";
import { UserDashboardView } from "../views/UserDashboardView";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { ConfirmPasswordDialog } from "./ConfirmPasswordDialog";
import { PortfolioFinances } from "./PortfolioFinances";
import type { UserProfile } from "../types";

/**
 * Main application container orchestrating Electron availability, user selection, and dashboard flows.
 * @component
 * @returns React element routing between profile picker, dashboards, and portfolio finance view.
 */
export function AppContainer() {
    const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
    const [userPropertiesCount, setUserPropertiesCount] = useState(0);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const isPortfolioRoute = typeof window !== "undefined" && window.location.pathname === "/finances/all";

    const {
        electronApi,
        users,
        loading,
        error,
        creating,
        selectedUser,
        menuOpenId,
        editingId,
        editingValue,
        newUserName,
        showCreateForm,
        enteredUser,
        setEditingValue,
        setNewUserName,
        setNewUserPassword,
        handleSelect,
        startEdit,
        cancelEdit,
        toggleMenu,
        handleCreateUser,
        handleSaveEdit,
        handleDeleteUser,
        handleEnterUserProfile,
        handleShowCreateForm,
        handleHideCreateForm,
    } = useUserManagement();

    const {
        activeTab,
        propertyForm,
        editingPropertyId,
        editPropertyDraft,
        properties,
        propertiesLoading,
        propertyError,
        creatingProperty,
        setActiveTab,
        setPropertyForm,
        setEditPropertyDraft,
        handleCreateProperty,
        handleStartEditProperty,
        cancelEditProperty,
        handleSavePropertyEdit,
        toggleArchive,
        resetEditing,
    } = usePropertyManagement(electronApi, enteredUser?.id ?? null);

    /**
     * Enter a user dashboard and align the active tab with the current route.
     * @param user Selected user profile instance.
     */
    function handleEnterUser(user: typeof users[0]) {
        handleEnterUserProfile(user);
        const path = typeof window !== "undefined" ? window.location.pathname : "/";
        const nextTab = path === "/finances" ? "finances" : path === "/stats" ? "stats" : "properties";
        setActiveTab(nextTab);
        resetEditing();
    }

    /**
     * Prefetch property count and open the delete confirmation flow for a user.
     * @param user Target user slated for deletion.
     */
    async function handleRequestDelete(user: UserProfile) {
        if (!electronApi) return;
        const userProps = await electronApi.listProperties(user.id);
        setUserPropertiesCount(userProps.length);
        setDeleteTarget(user);
        setShowPasswordConfirm(true);
    }

    /**
     * Confirm deletion after password verification.
     * @param password User password entered for confirmation.
     */
    async function handleConfirmDelete(password: string) {
        if (!deleteTarget) return;
        try {
            await handleDeleteUser(deleteTarget.id, password);
            setDeleteTarget(null);
            setUserPropertiesCount(0);
            setShowPasswordConfirm(false);
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
        }
    }

    /**
     * Abort user deletion flow and reset dialog state.
     */
    function handleCancelDelete() {
        setDeleteTarget(null);
        setUserPropertiesCount(0);
        setShowPasswordConfirm(false);
    }

    const languageToggle = (
        <div className="fixed right-4 top-4 z-50">
            <LanguageSwitcher />
        </div>
    );

    if (!electronApi)
        return (
            <>
                {languageToggle}
                <ElectronUnavailableView />
            </>
        );

    if (enteredUser && isPortfolioRoute) {
        return (
            <>
                {languageToggle}
                <PortfolioFinances
                    electronApi={electronApi}
                    properties={properties}
                    onBack={() => window.history.back()}
                    user={enteredUser}
                />
            </>
        );
    }

    if (enteredUser) {
        return (
            <>
                {languageToggle}
                <UserDashboardView
                    user={enteredUser}
                    activeTab={activeTab}
                    properties={properties}
                    propertiesLoading={propertiesLoading}
                    propertyError={propertyError}
                    propertyForm={propertyForm}
                    creatingProperty={creatingProperty}
                    editingPropertyId={editingPropertyId}
                    editPropertyDraft={editPropertyDraft}
                    onBack={() => handleEnterUserProfile(null)}
                    onTabChange={setActiveTab}
                    onPropertyFormChange={setPropertyForm}
                    onCreateProperty={handleCreateProperty}
                    onEditPropertyStart={handleStartEditProperty}
                    onEditPropertyCancel={cancelEditProperty}
                    onEditPropertySave={handleSavePropertyEdit}
                    onEditPropertyChange={setEditPropertyDraft}
                    onToggleArchive={toggleArchive}
                    electronApi={electronApi}
                />
            </>
        );
    }

    return (
        <>
            {languageToggle}
            <ProfileSelectionView
                users={users}
                loading={loading}
                error={error}
                selectedUser={selectedUser}
                editingId={editingId}
                editingValue={editingValue}
                menuOpenId={menuOpenId}
                showCreateForm={showCreateForm}
                newUserName={newUserName}
                creating={creating}
                onSelect={handleSelect}
                onDoubleClick={handleEnterUser}
                onMenuToggle={toggleMenu}
                onEditStart={startEdit}
                onEditChange={setEditingValue}
                onEditSave={handleSaveEdit}
                onEditCancel={cancelEdit}
                onDeleteClick={handleRequestDelete}
                onShowCreateForm={handleShowCreateForm}
                onHideCreateForm={handleHideCreateForm}
                onCreateNameChange={setNewUserName}
                onCreatePasswordChange={setNewUserPassword}
                onCreate={handleCreateUser}
            />
            {deleteTarget && !showPasswordConfirm && (
                <DeleteUserDialog
                    username={deleteTarget.username}
                    propertiesCount={userPropertiesCount}
                    onConfirm={() => setShowPasswordConfirm(true)}
                    onCancel={handleCancelDelete}
                />
            )}
            {deleteTarget && showPasswordConfirm && (
                <ConfirmPasswordDialog
                    username={deleteTarget.username}
                    propertiesCount={userPropertiesCount}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </>
    );
}
