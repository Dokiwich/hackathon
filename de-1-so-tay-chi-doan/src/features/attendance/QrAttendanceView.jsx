import React from 'react';
import QrOrganizerView from './QrOrganizerView';
import QrGpsScannerView from './QrGpsScannerView';

export default function QrAttendanceView({
  activities,
  members,
  allMembers = [],
  makeupList = [],
  currentUser,
  isOnline = false,
  onRefresh,
  onVerifyQrServer,
  onCheckIn,
  onAddActivity,
  onRotateQr,
  onUpdateActivityLocation,
  onCloseActivity,
  onDeleteActivity,
  onRegisterMakeup,
  onReviewMakeup,
  canOrganizeQr = false,
  canViewBranchProgress = false,
  canApproveMakeup = false
}) {
  if (canOrganizeQr) {
    return (
      <QrOrganizerView
        activities={activities}
        members={allMembers.length > 0 ? allMembers : members}
        makeupList={makeupList}
        isOnline={isOnline}
        onRefresh={onRefresh}
        onAddActivity={onAddActivity}
        onRotateQr={onRotateQr}
        onUpdateLocation={onUpdateActivityLocation}
        onCloseActivity={onCloseActivity}
        onDeleteActivity={onDeleteActivity}
        onReviewMakeup={onReviewMakeup}
      />
    );
  }

  return (
    <QrGpsScannerView
      activities={activities}
      members={members}
      makeupList={makeupList}
      currentUser={currentUser}
      isOnline={isOnline}
      onRefresh={onRefresh}
      onVerifyQrServer={onVerifyQrServer}
      onCheckIn={onCheckIn}
      onRegisterMakeup={onRegisterMakeup}
      onReviewMakeup={onReviewMakeup}
      canViewBranchProgress={canViewBranchProgress}
      canApproveMakeup={canApproveMakeup}
    />
  );
}
